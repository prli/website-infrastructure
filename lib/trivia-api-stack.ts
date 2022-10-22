import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export interface TriviaApiStackStackProps extends cdk.StackProps {
  apiGateway: cdk.aws_apigateway.IRestApi;
  resourcePath: string;
  authorizer?: apigateway.IAuthorizer;
}

export class TriviaApiStack extends cdk.Stack {

  constructor(parent: cdk.App, name: string, props: TriviaApiStackStackProps) {
    super(parent, name, props);

    const resource = props.apiGateway.root.addResource(props.resourcePath);

    resource.addMethod('POST', new apigateway.MockIntegration({
      integrationResponses: [
        {
          statusCode: "200",
          responseTemplates: {
            "application/json": JSON.stringify([
              {
                "id": "$context.requestId",
                "question": `mock trivia question $context.requestTime`,
                "answer": `mock trivia answer $context.requestTime very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long text very long text very long textvery long textvery long text very long text very long text very long text very long textvery long textvery long text very long text ${new Date().getTime()}`,
                "categories": ["categoryOne", "categoryTwo"],
                "createdAt": "$context.requestTime",
              },
            ], null, 4)
          },
          // Required for CORS
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Credentials': "'false'",
            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
          },
        }
      ],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{ "statusCode": 200 }',
      },
    }), {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': false,
            'method.response.header.Access-Control-Allow-Methods': false,
            'method.response.header.Access-Control-Allow-Credentials': false,
            'method.response.header.Access-Control-Allow-Origin': false,
          },
        },
      ],
      authorizer: props.authorizer,
    });

    resource.addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [
        {
          statusCode: "200",
          responseTemplates: {
            "application/json": JSON.stringify([
              {
                "id": "$context.requestId",
                "question": `mock trivia question $context.requestTime`,
                "answer": `mock trivia answer $context.requestTime very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long very long text very long text very long textvery long textvery long text very long text very long text very long text very long textvery long textvery long text very long text ${new Date().getTime()}`,
                "categories": ["categoryOne", "categoryTwo"],
                "createdAt": "$context.requestTime",
              },
            ], null, 4)
          },
          // required for CORS
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Credentials': "'false'",
            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
          },
        }
      ],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{ "statusCode": 200 }',
      },
    }), {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': false,
            'method.response.header.Access-Control-Allow-Methods': false,
            'method.response.header.Access-Control-Allow-Credentials': false,
            'method.response.header.Access-Control-Allow-Origin': false,
          },
        },
      ],
      authorizer: props.authorizer,
    });
  }
}