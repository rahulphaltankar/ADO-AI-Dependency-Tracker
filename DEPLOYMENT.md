# ADO-AI Dependency Tracker Deployment Guide

## Deployment Configuration

### Resource Requirements
For optimal performance of the AI-powered components, we recommend:

- **Machine Type**: Compute
- **CPU**: 2 vCPUs
- **Memory**: 4GB RAM
- **Storage**: 10GB
- **Scaling Options**:
  - Min Instances: 1
  - Max Instances: 3
  - Scale up at 70% CPU usage for 2+ minutes
  - Scale down at 30% CPU usage for 5+ minutes

### Environment Variables
Ensure these environment variables are set in your deployment:

- `NODE_ENV`: "production"
- `OPENAI_API_KEY`: Your OpenAI API key for AI analysis features

### Deployment Steps

1. **Prepare Application**:
   - Run `npm run build` locally to verify the build process succeeds
   - Verify all tests pass

2. **Deploy on Replit**:
   - Click the "Deploy" button in the Replit interface
   - Select "Compute" machine type
   - Configure environment variables as listed above
   - Enable HTTP/HTTPS connections
   - Save deployment configuration

3. **Post-Deployment Verification**:
   - Verify the application loads at the provided URL
   - Check that WebSocket connections work (for real-time updates)
   - Verify that PINN models initialize correctly
   - Test the dependency tracking features
   - Confirm AI analysis is working with sample data

### Troubleshooting

If you encounter any of these common issues:

1. **WebSocket Connection Failures**:
   - Verify the WebSocket path is `/ws`
   - Ensure proper CORS settings are enabled

2. **AI Analysis Not Working**:
   - Check that the OPENAI_API_KEY is properly set
   - Verify the API key has access to gpt-4o models

3. **Performance Issues**:
   - Consider scaling up resource allocation
   - Check for memory leaks in the Python PINN components
   - Optimize database queries if using an external database

## Monitoring

The application exposes basic metrics endpoints that can be integrated with monitoring tools:

- `/api/health`: Health check endpoint
- `/api/metrics`: Basic application metrics

## Scaling Considerations

As your user base grows, consider:

1. Moving to dedicated database instances
2. Implementing a CDN for static assets
3. Separating the AI processing into dedicated compute workers