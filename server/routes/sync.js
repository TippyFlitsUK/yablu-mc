import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

// Get all data (projects, tasks, completed, deleted)
router.get('/all', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      // Get projects
      const projectsResult = await client.query('SELECT * FROM projects ORDER BY order_index');
      const projects = projectsResult.rows.map(p => ({
        id: p.id,
        title: p.title,
        color: p.color,
        type: 'project'
      }));
      
      // Get tasks grouped by container
      const tasksResult = await client.query(`
        SELECT t.*, p.color as project_color 
        FROM tasks t 
        JOIN projects p ON t.project_id = p.id 
        ORDER BY t.container, t.order_index
      `);
      
      const tasks = tasksResult.rows.reduce((acc, task) => {
        if (!acc[task.container]) {
          acc[task.container] = [];
        }
        acc[task.container].push({
          id: task.id,
          title: task.title,
          notes: task.notes,
          projectId: task.project_id,
          projectColor: task.project_color,
          type: 'task'
        });
        return acc;
      }, {});
      
      // Get completed tasks
      const completedResult = await client.query(
        'SELECT task_data, completed_at FROM completed_tasks ORDER BY completed_at DESC'
      );
      const completedTasks = completedResult.rows.map(row => ({
        task: row.task_data,
        completedAt: row.completed_at.getTime()
      }));
      
      // Get deleted tasks  
      const deletedResult = await client.query(
        'SELECT task_data, deleted_at, original_container, original_index FROM deleted_tasks ORDER BY deleted_at DESC'
      );
      const deletedTasks = deletedResult.rows.map(row => ({
        task: row.task_data,
        deletedAt: row.deleted_at.getTime(),
        originalContainer: row.original_container,
        originalIndex: row.original_index
      }));
      
      res.json({
        projectDefinitions: projects,
        tasks,
        completedTasks,
        deletedTasks
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error syncing all data:', error);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// Import localStorage data to PostgreSQL
router.post('/import', async (req, res) => {
  try {
    const { projectDefinitions, tasks, completedTasks, deletedTasks } = req.body;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Clear existing data
      await client.query('DELETE FROM deleted_tasks');
      await client.query('DELETE FROM completed_tasks');
      await client.query('DELETE FROM tasks');
      await client.query('DELETE FROM projects');
      
      // Import projects
      if (projectDefinitions && projectDefinitions.length > 0) {
        for (let i = 0; i < projectDefinitions.length; i++) {
          const project = projectDefinitions[i];
          await client.query(
            'INSERT INTO projects (id, title, color, order_index) VALUES ($1, $2, $3, $4)',
            [project.id, project.title, project.color, i]
          );
        }
      }
      
      // Import tasks
      if (tasks) {
        for (const [container, containerTasks] of Object.entries(tasks)) {
          if (containerTasks && containerTasks.length > 0) {
            for (let i = 0; i < containerTasks.length; i++) {
              const task = containerTasks[i];
              await client.query(
                'INSERT INTO tasks (id, title, notes, project_id, container, order_index) VALUES ($1, $2, $3, $4, $5, $6)',
                [task.id, task.title, task.notes || '', task.projectId, container, i]
              );
            }
          }
        }
      }
      
      // Import completed tasks
      if (completedTasks && completedTasks.length > 0) {
        for (const completed of completedTasks) {
          await client.query(
            'INSERT INTO completed_tasks (task_data, completed_at) VALUES ($1, $2)',
            [JSON.stringify(completed.task), new Date(completed.completedAt)]
          );
        }
      }
      
      // Import deleted tasks
      if (deletedTasks && deletedTasks.length > 0) {
        for (const deleted of deletedTasks) {
          await client.query(
            'INSERT INTO deleted_tasks (task_data, deleted_at, original_container, original_index) VALUES ($1, $2, $3, $4)',
            [JSON.stringify(deleted.task), new Date(deleted.deletedAt), deleted.originalContainer, deleted.originalIndex]
          );
        }
      }
      
      await client.query('COMMIT');
      res.json({ message: 'Data imported successfully' });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

export default router;