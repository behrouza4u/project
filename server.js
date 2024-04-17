require('dotenv').config();
const express = require('express');
const app = express();

const path = require("path");
const cors=require('cors');
const mongoose=require('mongoose');
const axios=require('axios');
const multer = require('multer');
const User = require('./models/user');
const fs = require('fs'); 
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
require('express-async-errors');
const admin = require('firebase-admin');
//const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert({
        type: "service_account",
        project_id: process.env.PROJECT_ID,
        private_key_id: process.env.PRIVATE_KEY_ID,
        private_key:process.env.PRIVATE_KEY,
        client_email: process.env.CLIENT_EMAIL,
        client_id: process.env.CLIENT_ID,
        auth_uri: process.env.AUTH_URI,
        token_uri: process.env.TOKEN_URI,
        auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
        universe_domain: process.env.UNIVERSE_DOMAIN
    }),
    storageBucket: 'gs://project-web-design-bb61f.appspot.com'
});

const bucket = admin.storage().bucket();
app.use(cors())

const port = process.env.PORT || 5000

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(express.json())
app.use(cookieParser());

// Multer configuration for handling file uploads
//const upload = multer({ dest: 'uploads/' });
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
 // Store uploaded files in memory

//Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "public","index.html"));
})
app.get('/movies', (req, res) => {
    res.sendFile(path.join(__dirname, "public","movies.html"));
})
app.get('/news', (req, res) => {
    res.sendFile(path.join(__dirname, "public","news.html"));
})
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, "public","login.html"));
})
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, "public","register.html"));
})
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, "public","profile.html"));
})
app.get('/watchlist', (req, res) => {
    res.sendFile(path.join(__dirname, "public","watchlist.html"));
})
app.get('/firebaseUpload', (req, res) => {
    res.sendFile(path.join(__dirname, "public","firebaseupload.html"));
})

// Route to handle user registration form submission
app.post('/registerUser', upload.single('profilePicture'), async (req, res) => {
    try {
         // Hash the user's password
         const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create a new user instance with data from the form
        const newUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            age: req.body.age,
            occupation: req.body.occupation,
            dob: req.body.dob,
            email: req.body.email,
            password: hashedPassword,
        });

        // Save the user to MongoDB
        await newUser.save();

        res.status(201).send('User registered successfully!');
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Failed to register user');
    }
});

// Route to handle user login
app.post('/loginUser', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        // If user not found, display error message
        if (!user) {
            return res.status(400).send('Invalid email or password');
        }

        // Check if password matches
        if (await bcrypt.compare(password, user.password)) {

            // Set a cookie containing user information
            res.cookie('userData', user.email);
            console.log('true password')
            // Send success response
            res.status(200).send('Login successful');
        } else {
            console.log('false password')
            // Passwords don't match, display error message
            res.status(400).send('Invalid email or password');
        }
    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).send('Failed to login user');
    }
});

// Route to fetch user profile information
app.get('/profileInfo', upload.single('profilePicture'),async (req, res) => {
    try {
        //Extract email from the userData cookie
        const email = req.cookies.userData;
        if (!email) {
            return res.status(400).send('User data not found');
        }
        // Find user by email
        const user = await User.findOne({ email });

        // If user not found, display error message
        if (!user) {
            return res.status(400).send('User not found');
        }

        // Send user profile information as JSON response
        res.json(user);
    } catch (err) {
        console.error('Error fetching user profile information:', err);
        res.status(500).send('Failed to fetch user profile information');
    }
});
// Update profile route
app.put('/updateProfile', async (req, res) => {
    try {
        // Extract email from the userData cookie
        const email = req.cookies.userData;
        if (!email) {
            return res.status(400).send('User data not found');
        }

        // Retrieve updated profile information from request body
        const updatedProfile = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            age: req.body.age,
            occupation: req.body.occupation,
        };

        // Find the user by email and update their profile in the database
        const updatedUser = await User.findOneAndUpdate({ email }, updatedProfile, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return success response
        return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        // Handle error
        console.error('Error updating profile:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Define a route handler for fetching movie recommendations
app.get('/fetchWeather', async function(req, res) {
    try {
      // Fetch weather data using OpenWeatherMap API
      const apiUrl = "https://api.openweathermap.org/data/2.5/weather?q=Toronto&appid=86e75f371588044e06958ed994550298";
      const response = await axios.get(apiUrl);
  
      // Extract weather information from the response
      const weather = response.data.weather[0].main;
  
      // Send the weather information as a JSON response
      console.log({weather})
      res.json({ weather });
    } catch (error) {
      console.error("Error fetching weather data:", error);
      res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  });
  
  const weatherGenreMap = {
    Clear: ["Action", "Adventure", "Thriller","Music"],
    Clouds: ["Drama", "Mystery", "Crime","War","Western"],
    Rain: ["Romance", "Drama","Comedy","Fantasy","Horror"],
    Snow: ["Animation", "Family","Comedy","Fantasy","Horror"],
  };
  const genreIdsMap = {
    Action: 28,
    Adventure: 12,
    Animation: 16,
    Comedy: 35,
    Crime: 80,
    Documentary: 99,
    Drama: 18,
    Family: 10751,
    Fantasy: 14,
    History: 36,
    Horror: 27,
    Music: 10402,
    Mystery: 9648,
    Romance: 10749,
    "Science Fiction": 878,
    "TV Movie": 10770,
    Thriller: 53,
    War: 10752,
    Western: 37,
  };
app.get('/movieRecommendations', async function(req, res) {
    try {
      // Get weather data passed from the previous '/fetchWeather' route
      const { weather } = req.query;
  
      // Define genre mapping based on weather
      const genres = weatherGenreMap[weather] || ["Action"];
  
      // Fetch movie recommendations using genres
      const apiKey = "316645456cb403d9be8338a0d831a1fb";
      const apiUrl = `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc&api_key=${apiKey}`;
      const response = await axios.get(apiUrl);
   // Filter movies based on genres
      const filteredMovies = response.data.results.filter(movie =>
        genres.some(genre => movie.genre_ids.includes(genreIdsMap[genre]))
      );
     
  
      // Send the filtered movie recommendations as a JSON response
      res.json(filteredMovies);
    } catch (error) {
      console.error("Error fetching movie recommendations:", error);
      res.status(500).json({ error: 'Failed to fetch movie recommendations' });
    }
  });
  // Route to get all watchlist movies
app.get('/movieWatchList', async (req, res) => {
    try {
        // Extract user email from the userData cookie
        const email = req.cookies.userData;
        if (!email) {
            return res.status(400).send('User data not found');
        }

        // Find user by email
        const user = await User.findOne({ email });

        // If user not found, display error message
        if (!user) {
            return res.status(400).send('User not found');
        }

        // Fetch additional details for each movie from TMDB API
        const apiKey = "316645456cb403d9be8338a0d831a1fb";
        const promises = user.watchlist.map(async (movie) => {
            const tmdbApiUrl = `https://api.themoviedb.org/3/movie/${movie}?api_key=${apiKey}&language=en-US`;
            const response = await axios.get(tmdbApiUrl);
            return response.data;
        });

        // Wait for all promises to resolve
        const moviesDetails = await Promise.all(promises);

        res.status(200).json(moviesDetails);
    } catch (err) {
        console.error('Error retrieving watchlist movies:', err);
        res.status(500).send('Failed to retrieve watchlist movies');
    }
});


  app.get('/fetchNews', async function(req, res) {
    try {
      // Fetch news data from the News API
      const apiKey = "368313000fd9405a8f6d912b63137202";
      const apiUrl = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`;
      const response = await axios.get(apiUrl);
  
      // Send the news data as a JSON response
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching news data:", error);
      res.status(500).json({ error: 'Failed to fetch news data' });
    }
  });
  // Route to save movie to watchlist
app.post('/saveMovie', async (req, res) => {
    try {
        // Extract movie ID from request body
        const { movieId } = req.body;

        // Extract user email from the userData cookie
        const email = req.cookies.userData;
        if (!email) {
            return res.status(400).send('User data not found');
        }

        // Find user by email
        const user = await User.findOne({ email });

        // If user not found, display error message
        if (!user) {
            return res.status(400).send('User not found');
        }
        // Check if movie already exists in the watchlist
        if (user.watchlist.includes(movieId)) {
            return res.status(400).send('Movie already exists in watchlist');
        }

        // Add movie to watchlist
        user.watchlist.push(movieId);
        await user.save();

        res.status(200).send('Movie added to watchlist successfully');
    } catch (err) {
        console.error('Error saving movie to watchlist:', err);
        res.status(500).send('Failed to save movie to watchlist');
    }
});

// Route to remove movie from watchlist
app.post('/removeMovie', async (req, res) => {
    try {
        // Extract movie ID from request body
        const { movieId } = req.body;

        // Extract user email from the userData cookie
        const email = req.cookies.userData;
        if (!email) {
            return res.status(400).send('User data not found');
        }
    
        // Find user by email
        const user = await User.findOne({ email });

        // If user not found, display error message
        if (!user) {
            return res.status(400).send('User not found');
        }

        // Check if movie exists in the watchlist
        const movieIndex = user.watchlist.indexOf(movieId);
        if (movieIndex === -1) {
            return res.status(400).send('Movie not found in watchlist');
        }

        // Remove movie from watchlist
        user.watchlist.splice(movieIndex, 1);
        await user.save();

        res.status(200).send('Movie removed from watchlist successfully');
    } catch (err) {
        console.error('Error removing movie from watchlist:', err);
        res.status(500).send('Failed to remove movie from watchlist');
    }
});



// Endpoint for uploading images
app.post('/uploadImage', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send('No files were uploaded.');
      }
      const email = req.cookies.userData;
      if (!email) {
        return res.status(400).send('User data not found');
    }
    // Find user by email
    const user = await User.findOne({ email });

    // If user not found, display error message
    if (!user) {
        return res.status(400).send('User not found');
    }
      const file = req.file;
    //  const bucket = admin.storage().bucket();
      const fileUpload = bucket.file(file.originalname);
  
      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype
        }
      });
  
      blobStream.on('error', (error) => {
        console.log(error);
        res.status(500).send('Error uploading file.');
      });
  
      blobStream.on('finish',async () => {
        //const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
       // Generate a signed URL with a limited-time access token
       const options = {
        action: 'read',
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days expiry time
      };

      const [url] = await fileUpload.getSignedUrl(options);
        user.imageUrl.push(url);
        await user.save(); // Save the updated user document

        res.status(200).send(url);
      });
  
      blobStream.end(file.buffer);
    } catch (error) {
      console.log(error);
      res.status(500).send('Error uploading file.');
    }
  });
  
// Define route handler for GET /getUserImages
app.get('/getUserImages', async (req, res) => {
    try {
        // Extract user email from the userData cookie
        const email = req.cookies.userData;
        if (!email) {
            return res.status(400).send('User data not found');
        }

        // Find user by email
        const user = await User.findOne({ email });

        // If user not found, display error message
        if (!user) {
            return res.status(400).send('User not found');
        }

        // Send the user's image URLs as a response
        res.json(user.imageUrl);
    } catch (error) {
        console.error('Error fetching user images:', error);
        res.status(500).send('Internal server error.');
    }
});




const start = async () => {
    try {
        await mongoose.connect("mongodb+srv://bishalbanstola10:BRgWPfNwjD46YIVU@cluster0.a1i61rr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
        app.listen(port, () => {
            console.log(`server is running on port ${port}`)
        })
    }
    catch (error) {
        console.log(error)
    }
}

start()
