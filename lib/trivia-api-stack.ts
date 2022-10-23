import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { execSync } from 'child_process';
export interface TriviaApiStackStackProps extends cdk.StackProps {
  apiGateway: cdk.aws_apigateway.IRestApi;
  resourcePath: string;
  authorizer?: apigateway.IAuthorizer;
  lambdaCodePaths: {
    getTrivia: string;
  };
}

export class TriviaApiStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: TriviaApiStackStackProps) {
    super(parent, name, props);

    const resource = props.apiGateway.root.addResource(props.resourcePath);

    const getTriviaFunction = new lambda.Function(this, 'get-trivia-function', {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'index.getTriviaHandler',
      code: lambda.Code.fromAsset(props.lambdaCodePaths.getTrivia),
      environment: {},
      functionName: 'GetTrivia',
    });
    const getTriviaIntegration = new apigateway.LambdaIntegration(getTriviaFunction);

    resource.addMethod('GET', getTriviaIntegration, {
      authorizer: props.authorizer,
    });
  }
}
