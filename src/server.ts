import express from 'express';
import path from 'path';
import cors from 'cors';
import fs from 'fs-extra';
import bcrypt from 'bcrypt';
import { AddressInfo } from 'net';

// Define interfaces
interface User {
  name: string;
  college: string;
  username: string;
  password: string;
  created_at: string;
}

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001; // Changed to 3001 as a fallback

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Data file paths
const USERS_FILE = path.join(__dirname, '../data/users.json');
const COLLEGES_FILE = path.join(__dirname, '../data/colleges.json');

// Ensure data directory exists
fs.ensureDirSync(path.dirname(USERS_FILE));

// Helper function to read users
async function getUsers(): Promise<User[]> {
  try {
    if (await fs.pathExists(USERS_FILE)) {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Helper function to read colleges
async function getColleges(): Promise<string[]> {
  try {
    if (await fs.pathExists(COLLEGES_FILE)) {
      const data = await fs.readFile(COLLEGES_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading colleges file:', error);
    return [];
  }
}

// API routes
app.post('/api/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ available: false, message: 'Username is required' });
    }
    
    const users = await getUsers();
    const userExists = users.some(user => user.username.toLowerCase() === username.toLowerCase());
    
    res.json({ available: !userExists });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ available: false, message: 'Server error' });
  }
});

app.get('/api/colleges', async (req, res) => {
  try {
    const query = (req.query.q as string || '').toLowerCase();
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    const colleges = await getColleges();
    const filteredColleges = colleges
      .filter(college => college.toLowerCase().includes(query))
      .slice(0, 10);
    
    res.json(filteredColleges);
  } catch (error) {
    console.error('Error getting colleges:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, college, username, password, confirmPassword } = req.body;
    
    // Validate required fields
    if (!name || !college || !username || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    
    // Check if username exists
    const users = await getUsers();
    if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new user
    const newUser: User = {
      name,
      college,
      username,
      password: hashedPassword,
      created_at: new Date().toISOString()
    };
    
    // Add and save user
    users.push(newUser);
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    
    res.json({ success: true, message: 'Successfully Registered' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Default route - serve the HTML page
app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Try different ports if the initial one is busy
const server = app.listen(PORT, () => {
  const address = server.address() as AddressInfo;
  console.log(`Server running on http://localhost:${address.port}`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    // If port is busy, try the next one
    console.log(`Port ${PORT} is busy, trying ${+PORT + 1}`);
    app.listen(+PORT + 1, () => {
      const address = server.address() as AddressInfo;
      console.log(`Server running on http://localhost:${+PORT + 1}`);
    });
  } else {
    console.error('Server error:', err);
  }
});