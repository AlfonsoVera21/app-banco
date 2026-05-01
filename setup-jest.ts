import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

const { TextEncoder, TextDecoder } = require('util');
Object.assign(global, { TextEncoder, TextDecoder });

setupZoneTestEnv();
