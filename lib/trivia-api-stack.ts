import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as nodejslambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
export interface TriviaApiStackStackProps extends cdk.StackProps {
  apiGateway: cdk.aws_apigateway.IRestApi;
  resourcePath: string;
  authorizer?: apigateway.IAuthorizer;
  tableName: string;
  lambdaCodeEntries: {
    getTrivia: string;
  };
}

export class TriviaApiStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: TriviaApiStackStackProps) {
    super(parent, name, props);

    const triviaDynamoTable = new dynamodb.Table(this, `trivia-dynamoDb`, {
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING,
      },
      tableName: props.tableName,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // remove table and all its data when calling `cdk destroy`
    });

    const resource = props.apiGateway.root.addResource(props.resourcePath);

    const getTriviaNodeJsFunction = new nodejslambda.NodejsFunction(this, 'get-trivia-nodejs-function', {
      entry: props.lambdaCodeEntries.getTrivia,
      handler: 'getTriviaHandler',
      environment: {},
      functionName: 'GetTrivia',
      description: 'lambda function that fetches trivias from database',
    });
    triviaDynamoTable.grantReadData(getTriviaNodeJsFunction);

    const getTriviaIntegration = new apigateway.LambdaIntegration(getTriviaNodeJsFunction);
    resource.addMethod('GET', getTriviaIntegration, {
      authorizer: props.authorizer,
    });
  }
}
