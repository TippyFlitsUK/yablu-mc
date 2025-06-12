import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, p.color as project_color 
      FROM tasks t 
      JOIN projects p ON t.project_id = p.id 
      ORDER BY t.container, t.order_index
    `);
    
    // Group tasks by container
    const tasksByContainer = result.rows.reduce((acc, task) => {
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
    
    res.json(tasksByContainer);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const { id, title, notes = '', projectId, container = 'master' } = req.body;
    
    // Get next order index for this container
    const orderResult = await pool.query(
      'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM tasks WHERE container = $1',
      [container]
    );
    const orderIndex = orderResult.rows[0].next_order;
    
    const result = await pool.query(
      'INSERT INTO tasks (id, title, notes, project_id, container, order_index) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, title, notes, projectId, container, orderIndex]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, notes, projectId } = req.body;
    
    console.log('Task update request:', { id, title, notes, projectId });
    
    // Validate required fields
    if (!title || title.trim() === '') {
      console.error('Task update failed: Missing or empty title');
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!projectId) {
      console.error('Task update failed: Missing projectId');
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    const result = await pool.query(
      'UPDATE tasks SET title = $1, notes = $2, project_id = $3 WHERE id = $4 RETURNING *',
      [title, notes || '', projectId, id]
    );
    
    if (result.rows.length === 0) {
      console.error('Task update failed: Task not found with id:', id);
      return res.status(404).json({ error: 'Task not found' });
    }
    
    console.log('Task updated successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task:', {
      error: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body
    });
    res.status(500).json({ error: 'Failed to update task', details: error.message });
  }
});

// Move task to different container or reorder
router.post('/:id/move', async (req, res) => {
  try {
    const { id } = req.params;
    const { container, projectId, orderIndex } = req.body;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get source container before making any changes
      const sourceResult = await client.query('SELECT container FROM tasks WHERE id = $1', [id]);
      const sourceContainer = sourceResult.rows.length > 0 ? sourceResult.rows[0].container : null;
      
      // Update the task's container and project first
      if (projectId) {
        await client.query(
          'UPDATE tasks SET container = $1, project_id = $2 WHERE id = $3',
          [container, projectId, id]
        );
      } else {
        await client.query(
          'UPDATE tasks SET container = $1 WHERE id = $2',
          [container, id]
        );
      }
      
      // Clean up gaps in order_index for both source and target containers
      const containers = [container];
      if (sourceContainer && sourceContainer !== container) {
        containers.push(sourceContainer);
      }
      
      // Reindex each affected container to eliminate gaps and apply correct order
      for (const cont of containers) {
        const tasksResult = await client.query(
          'SELECT id FROM tasks WHERE container = $1 ORDER BY order_index, id',
          [cont]
        );
        
        // If this is the target container and we have a specific order index
        if (cont === container && orderIndex !== undefined) {
          // Get all tasks in this container
          const allTasks = tasksResult.rows.map(row => row.id);
          // Remove the moved task from its current position
          const taskIndex = allTasks.indexOf(id);
          if (taskIndex !== -1) {
            allTasks.splice(taskIndex, 1);
          }
          // Insert at the target position
          allTasks.splice(orderIndex, 0, id);
          
          // Update all tasks with their new positions
          for (let i = 0; i < allTasks.length; i++) {
            await client.query(
              'UPDATE tasks SET order_index = $1 WHERE id = $2',
              [i, allTasks[i]]
            );
          }
        } else {
          // Just reindex to eliminate gaps
          for (let i = 0; i < tasksResult.rows.length; i++) {
            await client.query(
              'UPDATE tasks SET order_index = $1 WHERE id = $2',
              [i, tasksResult.rows[i].id]
            );
          }
        }
      }
      
      await client.query('COMMIT');
      res.json({ message: 'Task moved successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error moving task:', error);
    res.status(500).json({ error: 'Failed to move task' });
  }
});

// Complete task
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get task data
      const taskResult = await client.query(`
        SELECT t.*, p.color as project_color 
        FROM tasks t 
        JOIN projects p ON t.project_id = p.id 
        WHERE t.id = $1
      `, [id]);
      
      if (taskResult.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      const task = taskResult.rows[0];
      
      // Insert into completed_tasks
      await client.query(
        'INSERT INTO completed_tasks (task_data, original_container, original_index) VALUES ($1, $2, $3)',
        [JSON.stringify({
          id: task.id,
          title: task.title,
          notes: task.notes,
          projectId: task.project_id,
          projectColor: task.project_color,
          type: 'task'
        }), task.container, task.order_index]
      );
      
      // Delete from tasks
      await client.query('DELETE FROM tasks WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      res.json({ message: 'Task completed successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Delete task (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get task data
      const taskResult = await client.query('SELECT * FROM tasks WHERE id = $1', [id]);
      
      if (taskResult.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      const task = taskResult.rows[0];
      
      // Insert into deleted_tasks
      await client.query(
        'INSERT INTO deleted_tasks (task_data, original_container, original_index) VALUES ($1, $2, $3)',
        [JSON.stringify({
          id: task.id,
          title: task.title,
          notes: task.notes,
          projectId: task.project_id,
          type: 'task'
        }), task.container, task.order_index]
      );
      
      // Delete from tasks
      await client.query('DELETE FROM tasks WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get completed tasks
router.get('/completed', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT task_data, completed_at FROM completed_tasks ORDER BY completed_at DESC'
    );
    
    const completedTasks = result.rows.map(row => ({
      task: row.task_data,
      completedAt: row.completed_at.getTime()
    }));
    
    res.json(completedTasks);
  } catch (error) {
    console.error('Error fetching completed tasks:', error);
    res.status(500).json({ error: 'Failed to fetch completed tasks' });
  }
});

// Get deleted tasks
router.get('/deleted', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT task_data, deleted_at, original_container, original_index FROM deleted_tasks ORDER BY deleted_at DESC'
    );
    
    const deletedTasks = result.rows.map(row => ({
      task: row.task_data,
      deletedAt: row.deleted_at.getTime(),
      originalContainer: row.original_container,
      originalIndex: row.original_index
    }));
    
    res.json(deletedTasks);
  } catch (error) {
    console.error('Error fetching deleted tasks:', error);
    res.status(500).json({ error: 'Failed to fetch deleted tasks' });
  }
});

// Restore deleted task
router.post('/restore/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get deleted task
      const deletedResult = await client.query(
        'SELECT * FROM deleted_tasks WHERE task_data->>\'id\' = $1',
        [taskId]
      );
      
      if (deletedResult.rows.length === 0) {
        return res.status(404).json({ error: 'Deleted task not found' });
      }
      
      const deletedTask = deletedResult.rows[0];
      const taskData = deletedTask.task_data;
      
      // Insert back into tasks
      await client.query(
        'INSERT INTO tasks (id, title, notes, project_id, container, order_index) VALUES ($1, $2, $3, $4, $5, $6)',
        [taskData.id, taskData.title, taskData.notes, taskData.projectId, 
         deletedTask.original_container || 'master', deletedTask.original_index || 0]
      );
      
      // Remove from deleted_tasks
      await client.query('DELETE FROM deleted_tasks WHERE task_data->>\'id\' = $1', [taskId]);
      
      await client.query('COMMIT');
      res.json({ message: 'Task restored successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error restoring task:', error);
    res.status(500).json({ error: 'Failed to restore task' });
  }
});

export default router;