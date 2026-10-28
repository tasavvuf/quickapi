import { Router } from 'express';
import { sendRequest, benchmark } from '../controllers/proxy.controller.js';
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from '../controllers/workspace.controller.js';
import { getCollections, getCollection, createCollection, updateCollection, deleteCollection } from '../controllers/collection.controller.js';
import { getRequests, getRequest, createRequest, updateRequest, deleteRequest } from '../controllers/request.controller.js';
import { getHistory, deleteHistory, clearHistory } from '../controllers/history.controller.js';
import { getEnvironments, getEnvironment, createEnvironment, updateEnvironment, deleteEnvironment } from '../controllers/environment.controller.js';
import { getDocumentation } from '../controllers/documentation.controller.js';
import { getComments, createComment, deleteComment } from '../controllers/comment.controller.js';

const router = Router();

// Proxy / execution
router.post('/proxy/send', sendRequest);
router.post('/proxy/benchmark', benchmark);

// Workspaces
router.get('/workspaces', getWorkspaces);
router.post('/workspaces', createWorkspace);
router.put('/workspaces/:id', updateWorkspace);
router.delete('/workspaces/:id', deleteWorkspace);

// Collections
router.get('/collections', getCollections);
router.get('/collections/:id', getCollection);
router.post('/collections', createCollection);
router.put('/collections/:id', updateCollection);
router.delete('/collections/:id', deleteCollection);

// Requests
router.get('/requests', getRequests);
router.get('/requests/:id', getRequest);
router.post('/requests', createRequest);
router.put('/requests/:id', updateRequest);
router.delete('/requests/:id', deleteRequest);

// History
router.get('/history', getHistory);
router.delete('/history/clear', clearHistory);
router.delete('/history/:id', deleteHistory);

// Environments
router.get('/environments', getEnvironments);
router.get('/environments/:id', getEnvironment);
router.post('/environments', createEnvironment);
router.put('/environments/:id', updateEnvironment);
router.delete('/environments/:id', deleteEnvironment);

// Documentation
router.get('/documentation/:collectionId', getDocumentation);

// Comments
router.get('/comments', getComments);
router.post('/comments', createComment);
router.delete('/comments/:id', deleteComment);

export default router;
