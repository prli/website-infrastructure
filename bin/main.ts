#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { StaticSiteWithCloudfront } from '../lib/static-site-with-cloudfront';
import { ApiGatewayWithCustomDomain } from '../lib/api-gateway-with-custom-domain';
import { ApiGatewayResources } from '../lib/api-gateway-resources';

export interface LambdaBackedCustomDomainWebsiteStackProps extends cdk.StackProps {
  domainName: string;
}

class LambdaBackedCustomDomainWebsiteStack extends cdk.Stack {

  hostedZone: route53.HostedZone;
  certificate: acm.Certificate;

  constructor(parent: cdk.App, name: string, props: LambdaBackedCustomDomainWebsiteStackProps) {
    super(parent, name, props);

    this.hostedZone = new route53.HostedZone(this, `HostedZone`, {
      zoneName: props.domainName,
    });

    // TLS certificate
    this.certificate = new acm.DnsValidatedCertificate(this, `DnsValidatedCertificate`, {
      // IMPORTANT: if you are creating a certificate as part of your stack, the stack will not complete creating until certificate is validated.
      domainName: props.domainName,
      subjectAlternativeNames: [`*.${props.domainName}`],
      hostedZone: this.hostedZone,
      region: 'us-east-1', //must be us-east-1 for cloudfront
      cleanupRoute53Records: true,
    });

    const staticSiteWithCloudfront = new StaticSiteWithCloudfront(this, 'StaticSiteWithCloudfront', {
      domainName: props.domainName,
      hostedZone: this.hostedZone,
      certificate: this.certificate,
      siteContentSources: [s3deploy.Source.asset('../front-end/build')]
    });

    const apiGatewayWithCustomDomain = new ApiGatewayWithCustomDomain(this, 'ApiGatewayWithCustomDomain', {
      domainName: `api.${props.domainName}`,
      hostedZone: this.hostedZone,
      certificate: this.certificate,
    });

    const foobarApiGatewayResources = new ApiGatewayResources(this, 'FoobarApiGatewayResources', {
      apiGateway: apiGatewayWithCustomDomain.restApi,
      resourcePath: 'foobar',
    }); 
  }
}

const app = new cdk.App();
const lambdaBackedCustomDomainWebsiteStack = new LambdaBackedCustomDomainWebsiteStack(app, 'LambdaBackedCustomDomainWebsiteStack', {
  domainName: 'lipeiran.dev',
  description: 'stack that deploys a website backed by lambda and authorized with cognito',
});