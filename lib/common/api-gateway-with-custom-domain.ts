#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export interface ApiGatewayWithCognitoProps {
  /**
   * Fully Qualified Domain Name (FQDN) of api gateway.
   */
  domainName: string;
  /**
   * Api Gateway is created with EDGE type, therefore certificate must be in us-east-1.
   */
  certificate: acm.Certificate;
  hostedZone: route53.HostedZone;
}

export class ApiGatewayWithCustomDomain extends Construct {
  readonly restApi: apigateway.RestApi;

  constructor(parent: cdk.Stack, apiName: string, props: ApiGatewayWithCognitoProps) {
    super(parent, apiName);

    this.restApi = new apigateway.RestApi(this, `${apiName}-restApi`, {
      restApiName: apiName,
      domainName: {
        domainName: props.domainName,
        certificate: props.certificate,
        endpointType: apigateway.EndpointType.EDGE,
        securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      }
    });

    new route53.ARecord(this, `${apiName}-ApigCustomDomainAliasRecord`, {
      zone: props.hostedZone,
      target: route53.RecordTarget.fromAlias(new targets.ApiGateway(this.restApi)),
      recordName: props.domainName,
    });
  }
}
