import express from 'express';

const router = express.Router();
const revision = require('child_process')
  .execSync('git rev-parse HEAD')
  .toString().trim();

router.get('/', (_req, res) => res.status(200).send({ project: "<%= projectName %>", version: revision }));

export default router;
