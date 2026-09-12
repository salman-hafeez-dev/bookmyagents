# CORS Configuration Guide

This guide shows how to configure CORS (Cross-Origin Resource Sharing) for your backend server to work with the TourEx frontend.

## Backend CORS Configuration

### For Express.js (Node.js).

```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',  // Your backend server
    'http://127.0.0.1:5173',  // Alternative localhost
    'http://127.0.0.1:3000'   // Alternative localhost
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
```

### For FastAPI (Python)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Your backend server
        "http://127.0.0.1:5173",  # Alternative localhost
        "http://127.0.0.1:3000"   # Alternative localhost
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin"
    ],
)
```

### For Spring Boot (Java)

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "http://localhost:5173",  // Vite dev server
                    "http://localhost:3000",  // Your backend server
                    "http://127.0.0.1:5173",  // Alternative localhost
                    "http://127.0.0.1:3000"   // Alternative localhost
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders(
                    "Content-Type",
                    "Authorization",
                    "X-Requested-With",
                    "Accept",
                    "Origin"
                )
                .allowCredentials(true);
    }
}
```

### For Laravel (PHP)

```php
// In config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5173',  // Vite dev server
        'http://localhost:3000',  // Your backend server
        'http://127.0.0.1:5173',  // Alternative localhost
        'http://127.0.0.1:3000'   // Alternative localhost
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

## Required Headers

Your backend should allow these headers:

- `Content-Type`: For JSON data
- `Authorization`: For JWT tokens
- `X-Requested-With`: For AJAX requests
- `Accept`: For content negotiation
- `Origin`: For CORS validation

## Required Methods

Your backend should allow these HTTP methods:

- `GET`: For retrieving data
- `POST`: For creating data and authentication
- `PUT`: For updating data
- `DELETE`: For deleting data
- `OPTIONS`: For preflight requests

## Frontend Configuration

The frontend is already configured with:

1. **Vite Proxy**: Routes `/api` requests to `http://localhost:3000/api`
2. **Axios Headers**: Includes proper headers for CORS
3. **Credentials**: Enabled for cookie/session support

## Testing CORS

You can test CORS configuration using:

```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  http://localhost:3000/api/auth/login

# Test actual request
curl -X POST \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  http://localhost:3000/api/auth/login
```

## Production Considerations

For production, update the `allowedOrigins` to include your actual domain:

```javascript
const corsOptions = {
  origin: [
    'https://yourdomain.com',     // Production frontend
    'https://www.yourdomain.com'  // Production frontend with www
  ],
  // ... rest of configuration
};
```

## Troubleshooting

Common CORS issues and solutions:

1. **"Access to fetch at '...' has been blocked by CORS policy"**
   - Check if your backend CORS configuration includes the frontend origin
   - Verify that the backend is running on the correct port

2. **"Request header field authorization is not allowed"**
   - Add `Authorization` to the `allowedHeaders` list

3. **"Response to preflight request doesn't pass access control check"**
   - Ensure your backend handles OPTIONS requests properly
   - Check that all required headers are in `allowedHeaders`

4. **"Credentials flag is true, but the 'Access-Control-Allow-Credentials' header is not set"**
   - Set `credentials: true` in your CORS configuration
   - Ensure `Access-Control-Allow-Credentials: true` is in the response headers
