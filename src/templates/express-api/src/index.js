import '@babel/polyfill';
import pino from 'pino';

import app from './app';
import { port, logLevel } from './config';

const logger = pino({ level: logLevel || 'info' });

app.listen(port, () => {
  logger.info('Server running on port %d', port);
});

