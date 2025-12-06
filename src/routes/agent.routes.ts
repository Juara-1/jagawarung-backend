import { Router } from 'express';
const router = Router();

router.post('/', (_req, res) => {
  res.send('Test');
});

export default router;
