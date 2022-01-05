import {SchemaObject} from '@loopback/rest';

const CredentialsSchema: SchemaObject = {
  type: 'object',
  required: ['appname', 'username', 'password', 'webhook_url'],
  properties: {
    appname: {
      type: 'string',
    },
    username: {
      type: 'string',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
    webhook_url: {
      type: 'string',
    },
  },
};

const ConcurrentRequestSchema: SchemaObject = {
  type: 'object',
  required: ['guid'],
  properties: {
    guid: {
      type: 'string',
    },
  },
}

const FindRequestSchema: SchemaObject = {
  type: 'object',
  required: ['guid', 'patient_id'],
  properties: {
    guid: {
      type: 'string',
    },
    patient_id: {
      type: 'string',
    },
  },
}

const CreateRequestSchema: SchemaObject = {
  type: 'object',
  required: [
    'guid',
    'name',
    'family_name',
    'gender',
    'birthdate',
    'birthmonth',
    'birthyear',
    'address',
    'city',
    'state',
    'country',
    'postal_code',
    'phone_no',
  ],
  properties: {
    guid: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
    family_name: {
      type: 'string',
    },
    gender: {
      type: 'string',
    },
    birthdate: {
      type: 'string',
    },
    birthmonth: {
      type: 'string',
    },
    birthyear: {
      type: 'string',
    },
    address: {
      type: 'string',
    },
    city: {
      type: 'string',
    },
    state: {
      type: 'string',
    },
    country: {
      type: 'string',
    },
    postal_code: {
      type: 'string',
    },
    phone_no: {
      type: 'string',
    },
  },
}

export const CredentialsRequestBody = {
  description: 'The input of login function',
  required: true,
  content: {
    'application/json': {schema: CredentialsSchema},
  },
};

export const ConcurrentRequestBody = {
  description: 'The input concurrent request',
  required: true,
  content: {
    'application/json': {
      schema: ConcurrentRequestSchema
    },
  },
};

export const FindRequestBody = {
  description: 'The input for find a patient request',
  required: true,
  content: {
    'application/json': {
      schema: FindRequestSchema
    },
  },
};

export const CreateRequestBody = {
  description: 'Input for create a patient request',
  required: true,
  content: {
    'application/json': {
      schema: CreateRequestSchema
    },
  },
};
export interface CreateSessionResObj {
  guid: string
  message: string
  status: number
};
