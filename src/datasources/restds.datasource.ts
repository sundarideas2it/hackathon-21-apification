import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'restds',
  connector: 'rest',
  baseURL: 'https://webhook.site/',
  crud: false,
  options: {
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
  },
  operations: [
    {
      template: {
        method: 'POST',
        url: '{webhook_url}',
        body: {
          application: '{appname}',
          patient_info: {
            id: '{patient_id}',
            name: '{patient_name}'
          }
        },
      },
      functions: {
        createPatient: ['appname', 'webhook_url', 'patient_id', 'patient_name']
      },
    },
    {
      template: {
        method: 'POST',
        url: '{webhook_url}',
        body: {
          application: '{appname}',
          patient_records: '{patient_records}'
        },
      },
      functions: {
        findPatient: ['appname', 'webhook_url', 'patient_records']
      },
    }
  ],
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class RestdsDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'restds';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.restds', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
