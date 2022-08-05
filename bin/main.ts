#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

export interface LambdaBackedCustomDomainWebsiteStackProps extends cdk.StackProps {
  domainName: string;
}

class LambdaBackedCustomDomainWebsiteStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props: LambdaBackedCustomDomainWebsiteStackProps) {
    super(parent, name, props);

  }
}

const app = new cdk.App();
const lambdaBackedCustomDomainWebsiteStack = new LambdaBackedCustomDomainWebsiteStack(app, 'LambdaBackedCustomDomainWebsiteStack', {
  domainName: 'lipeiran.dev',
  description: 'stack that deploys a website backed by lambda and authorized with cognito',
});