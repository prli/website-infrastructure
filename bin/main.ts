#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LambdaBackedCustomDomainWebsiteStack } from '../lib/lambda-backed-custom-domain-website-stack';
import { TriviaApiStack } from '../lib/trivia-api-stack';

const app = new cdk.App();

const lambdaBackedCustomDomainWebsiteStack = new LambdaBackedCustomDomainWebsiteStack(
  app,
  'LambdaBackedCustomDomainWebsiteStack',
  {
    domainName: 'lipeiran.dev',
    description: 'stack that deploys a website backed by lambda and authorized with cognito',
  },
);

const triviaApiStack = new TriviaApiStack(app, 'TriviaApiStack', {
  apiGateway: lambdaBackedCustomDomainWebsiteStack.apiGateway,
  description: 'stack that deploys APIs for trivia',
  resourcePath: 'trivia',
  lambdaCodePaths: {
    getTrivia: app.node.tryGetContext('getTriviaLambdaPath')!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
  },
});
