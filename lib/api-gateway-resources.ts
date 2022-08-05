#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export interface ApiGatewayResourcesProps {
  apiGateway: apigateway.IRestApi;
  resourcePath: string;
  authorizer?: apigateway.IAuthorizer;
}

export class ApiGatewayResources extends Construct {
  constructor(parent: cdk.Stack, id: string, props: ApiGatewayResourcesProps) {
    super(parent, id);

    const resource = props.apiGateway.root.addResource(props.resourcePath);

    resource.addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [
        {
          statusCode: "200",
          responseTemplates: {
            "application/json": JSON.stringify({
              "id": "$context.requestId",
              "createdAt": "$context.requestTime",
            }, null, 4)
          },
        }
      ],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{ "statusCode": 200 }',
      },
    }), {
      methodResponses: [
        { statusCode: '200' },
      ],
      authorizer: props.authorizer,
    });
  }
}
