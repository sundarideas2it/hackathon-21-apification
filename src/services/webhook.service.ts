import {BindingScope, inject, injectable, Provider} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {RestdsDataSource} from '../datasources';

export interface Webhook {
  // this is where you define the Node.js methods that will be
  // mapped to REST/SOAP/gRPC operations as stated in the datasource
  // json file.
  createPatient(
    appname: string,
    webhook_url: string,
    patient_id: string,
    patient_name: string
  ): Promise<object>;

  findPatient(
    appname: string,
    webhook_url: string,
    patient_records: object
  ): Promise<object>;
}

export class WebhookProvider implements Provider<Webhook> {
  constructor(
    // restds must match the name property in the datasource json file
    @inject('datasources.restds')
    protected dataSource: RestdsDataSource = new RestdsDataSource(),
  ) { }

  value(): Promise<Webhook> {
    return getService(this.dataSource);
  }
}


@injectable({scope: BindingScope.TRANSIENT})
export class WebhookService {
  constructor(
    @inject('services.Webhook') private webhookservice: Webhook
  ) { }

  async createPatient(params: any): Promise<object> {
    try {
      const webPatient = await this.webhookservice.createPatient(
        params.appname,
        params.webhook_url,
        params.patient_id,
        params.patient_name);

      return {};
    } catch (error) {
      throw error;
    }
  }

  async findPatient(params: any): Promise<object> {
    try {
      const webPatient = await this.webhookservice.findPatient(
        params.appname,
        params.webhook_url,
        params.patient_dtls,
      );

      return {};
    } catch (error) {
      throw error;
    }
  }
}
