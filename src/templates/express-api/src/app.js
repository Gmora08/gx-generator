import '@babel/polyfill';
// import appInsights from 'applicationinsights';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import expressPino from 'express-pino-logger';
import pino from 'pino';

import { logLevel } from './config';
import router from './routes';

const logger = pino({ level: logLevel || 'info' });
const expressLogger = expressPino({ logger });

const app = express();
app.use(helmet());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  }),
);
app.use(cors());
app.use(expressLogger);
app.use(router);

module.exports = app;

