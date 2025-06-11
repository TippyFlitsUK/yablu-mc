import express from 'express';
import pool from '../database/connection.js';

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY order_index');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create project
router.post('/', async (req, res) => {
  try {
    const { id, title, color } = req.body;
    
    // Get next order index
    const orderResult = await pool.query('SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM projects');
    const orderIndex = orderResult.rows[0].next_order;
    
    const result = await pool.query(
      'INSERT INTO projects (id, title, color, order_index) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, title, color, orderIndex]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, color } = req.body;
    
    const result = await pool.query(
      'UPDATE projects SET title = $1, color = $2 WHERE id = $3 RETURNING *',
      [title, color, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Reorder projects
router.post('/reorder', async (req, res) => {
  try {
    const { projectIds } = req.body; // Array of project IDs in new order
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (let i = 0; i < projectIds.length; i++) {
        await client.query(
          'UPDATE projects SET order_index = $1 WHERE id = $2',
          [i, projectIds[i]]
        );
      }
      
      await client.query('COMMIT');
      res.json({ message: 'Projects reordered successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error reordering projects:', error);
    res.status(500).json({ error: 'Failed to reorder projects' });
  }
});

export default router;