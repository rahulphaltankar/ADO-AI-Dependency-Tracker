import { Strategy as AzureAdOAuth2Strategy } from 'passport-azure-ad-oauth2';
import { RequestHandler } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { IStorage } from '../storage';
import { AdoSettings, InsertAdoSettings } from '@shared/schema';

// Decoding the JWT token from Azure AD
interface AzureAdJwtPayload {
  oid: string; // Object ID (user ID)
  name?: string;
  email?: string;
  upn?: string; // User Principal Name
  exp: number; // Expiration time
  [key: string]: any;
}

// Configure Azure AD OAuth2 strategy
export function setupAzureOAuth(storage: IStorage): boolean {
  // The CLIENT_ID must be configured in Azure Active Directory
  const clientID = process.env.AZURE_CLIENT_ID;
  
  if (!clientID) {
    console.warn('Missing AZURE_CLIENT_ID environment variable - OAuth functionality will be disabled');
    return false;
  }

  passport.use(new AzureAdOAuth2Strategy({
    clientID,
    clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    callbackURL: process.env.AZURE_CALLBACK_URL || 'http://localhost:3000/api/auth/azure/callback',
    resource: 'https://management.azure.com/'
  }, async (accessToken: string, refreshToken: string, params: any, profile: any, done: any) => {
    try {
      // Decode the id_token to get Azure AD profile information
      const idToken = params.id_token;
      
      if (!idToken) {
        return done(new Error('No id_token found in OAuth response'));
      }
      
      const decodedToken = jwt.decode(idToken) as AzureAdJwtPayload;
      
      if (!decodedToken) {
        return done(new Error('Failed to decode id_token'));
      }
      
      // Calculate expiration time
      const expiresIn = params.expires_in || 3600; // Default to 1 hour if not specified
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
      
      // Return user information and tokens
      return done(null, {
        id: decodedToken.oid,
        name: decodedToken.name || decodedToken.upn || 'Unknown User',
        email: decodedToken.email || decodedToken.upn || '',
        accessToken,
        refreshToken,
        expiresAt
      });
    } catch (error) {
      console.error('Error during Azure AD authentication:', error);
      return done(error);
    }
  }));
  
  // Store user data in session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });
  
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
  
  // If we reach here, configuration was successful
  return true;
}

// Middleware to initiate authentication
export const initiateAzureAuth: RequestHandler = (req, res, next) => {
  // Add state parameter to track where to redirect after auth
  const redirectTo = req.query.redirectTo as string || '/settings';
  
  passport.authenticate('azure_ad_oauth2', {
    state: JSON.stringify({ redirectTo }),
    prompt: 'select_account', // Always prompt for account selection
    response_type: 'code id_token', // Request both authorization code and id token
    response_mode: 'form_post', // Use form_post to secure the tokens
    scope: 'openid profile email offline_access https://dev.azure.com/user_impersonation' // Request scopes for Azure DevOps API
  })(req, res, next);
};

// Middleware to handle the callback from Azure AD
export const handleAzureAuthCallback: RequestHandler = (req, res, next) => {
  passport.authenticate('azure_ad_oauth2', async (err: any, user: any) => {
    if (err) {
      console.error('Auth error:', err);
      return res.redirect('/settings?error=auth_failed');
    }
    
    if (!user) {
      return res.redirect('/settings?error=no_user');
    }
    
    try {
      // Store the user in session
      req.login(user, async (loginErr) => {
        if (loginErr) {
          console.error('Session error:', loginErr);
          return res.redirect('/settings?error=session_error');
        }
        
        // Parse the state parameter to get the redirect URL
        const state = req.body.state || '{}';
        let redirectTo = '/settings';
        
        try {
          const stateObj = JSON.parse(state);
          redirectTo = stateObj.redirectTo || redirectTo;
        } catch (e) {
          console.error('Failed to parse state:', e);
        }
        
        // Redirect to the original page or settings by default
        return res.redirect(redirectTo);
      });
    } catch (error) {
      console.error('Error in auth callback:', error);
      return res.redirect('/settings?error=server_error');
    }
  })(req, res, next);
};

// Middleware to handle saving the OAuth tokens for a specific Azure DevOps organization and project
export const saveAzureDevOpsConnection = async (
  storage: IStorage,
  userId: number, 
  organization: string,
  project: string,
  accessToken: string,
  refreshToken: string,
  tokenExpiresAt: Date
): Promise<AdoSettings> => {
  try {
    // Check if settings already exist
    const existingSettings = await storage.getAdoSettings(userId);
    
    if (existingSettings) {
      // Update existing settings
      return await storage.updateAdoSettings(existingSettings.id, {
        organization,
        project,
        accessToken,
        refreshToken,
        tokenExpiresAt,
        useOAuth: true
      });
    } else {
      // Create new settings
      const insertSettings: InsertAdoSettings = {
        userId,
        organization,
        project,
        accessToken,
        refreshToken,
        tokenExpiresAt,
        useOAuth: true
      };
      
      return await storage.createAdoSettings(insertSettings);
    }
  } catch (error) {
    console.error('Error saving Azure DevOps connection:', error);
    throw new Error('Failed to save Azure DevOps connection settings');
  }
};

// Refresh the access token if it's expired
export const refreshAccessToken = async (
  storage: IStorage,
  adoSettings: AdoSettings
): Promise<AdoSettings> => {
  // Check if the token is expired
  const now = new Date();
  if (!adoSettings.tokenExpiresAt || adoSettings.tokenExpiresAt > now) {
    // Token is still valid
    return adoSettings;
  }
  
  try {
    // In a real implementation, this would call the Azure AD token endpoint
    // to refresh the token. For now, we'll just throw an error to prompt 
    // the user to re-authenticate.
    throw new Error('Token refresh not yet implemented - please re-authenticate');
    
    // TODO: Implement token refresh logic using refresh token
    /*
    const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    const response = await axios.post(tokenEndpoint, {
      client_id: process.env.AZURE_CLIENT_ID,
      client_secret: process.env.AZURE_CLIENT_SECRET,
      refresh_token: adoSettings.refreshToken,
      grant_type: 'refresh_token',
      scope: 'https://dev.azure.com/user_impersonation'
    });
    
    // Calculate new expiration time
    const expiresIn = response.data.expires_in || 3600;
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
    
    // Update the settings with the new tokens
    return await storage.updateAdoSettings(adoSettings.id, {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || adoSettings.refreshToken,
      tokenExpiresAt: expiresAt
    });
    */
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token');
  }
};

// Middleware to check if the user is authenticated
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // If AJAX request
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // For regular requests, redirect to login
  return res.redirect('/login');
};