import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { ApiGatewayWithCustomDomain } from './common/api-gateway-with-custom-domain';
import { StaticSiteWithCloudfront } from './common/static-site-with-cloudfront';

export interface LambdaBackedCustomDomainWebsiteStackProps extends cdk.StackProps {
  domainName: string;
  siteContentSourcePath: string;
  dkimValue?: string;
}

export class LambdaBackedCustomDomainWebsiteStack extends cdk.Stack {
  readonly hostedZone: route53.HostedZone;
  readonly certificate: acm.Certificate;
  readonly apiGateway: cdk.aws_apigateway.RestApi;

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
      siteContentSources: [s3deploy.Source.asset(props.siteContentSourcePath)],
    });

    const apiGatewayWithCustomDomain = new ApiGatewayWithCustomDomain(this, 'ApiGatewayWithCustomDomain', {
      domainName: `api.${props.domainName}`,
      hostedZone: this.hostedZone,
      certificate: this.certificate,
    });
    this.apiGateway = apiGatewayWithCustomDomain.restApi;

    if (props.dkimValue) {
      this.setupEmailDnsRecords(props.dkimValue);
    }
  }

  setupEmailDnsRecords(dkimValue: string) {
    const mxRecord = new route53.MxRecord(this, 'MxRecord', {
      zone: this.hostedZone,
      values: [
        {
          hostName: 'mx1.privateemail.com',
          priority: 10,
        },
        {
          hostName: 'mx2.privateemail.com',
          priority: 10,
        },
      ],
    });

    const SPFTxtRecord = new route53.TxtRecord(this, 'SPFRecord', {
      zone: this.hostedZone,
      values: ['v=spf1 include:spf.privateemail.com ~all'],
    });

    const DKIMTxtRecord = new route53.TxtRecord(this, 'DKIMRecord', {
      zone: this.hostedZone,
      recordName: 'default._domainkey',
      values: [dkimValue],
    });

    const mailCNameRecord = new route53.CnameRecord(this, 'MailCNameRecord', {
      zone: this.hostedZone,
      recordName: 'mail',
      domainName: 'privateemail.com',
    });

    const autoconfigCNameRecord = new route53.CnameRecord(this, 'AutoconfigCNameRecord', {
      zone: this.hostedZone,
      recordName: 'autoconfig',
      domainName: 'privateemail.com',
    });

    const autodiscoverCNameRecord = new route53.CnameRecord(this, 'AutodiscoverCNameRecord', {
      zone: this.hostedZone,
      recordName: 'autodiscover',
      domainName: 'privateemail.com',
    });

    const srvRecord = new route53.SrvRecord(this, 'SrvRecord', {
      zone: this.hostedZone,
      recordName: '_autodiscover._tcp',
      values: [
        {
          hostName: 'privateemail.com',
          priority: 0,
          weight: 0,
          port: 443,
        },
      ],
    });
  }
}
