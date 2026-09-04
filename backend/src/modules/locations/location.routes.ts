 import { Router } from 'express';
import {
  countryController,
  stateController,
  cityController,
  siteController,
  payRegisterController,
} from './location.controller';

const router = Router();

// Helper to bind standard CRUD REST endpoints to a router
const registerCrudRoutes = (path: string, controller: any) => {
  router.post(`/${path}`, controller.create);
  router.get(`/${path}`, controller.getAll);
  router.get(`/${path}/:id`, controller.getById);
  router.put(`/${path}/:id`, controller.update);
  router.delete(`/${path}/:id`, controller.delete);
};

// Registered Endpoints
registerCrudRoutes('countries', countryController);
registerCrudRoutes('states', stateController);
registerCrudRoutes('cities', cityController);
registerCrudRoutes('sites', siteController);
registerCrudRoutes('pay-registers', payRegisterController);

export default router;