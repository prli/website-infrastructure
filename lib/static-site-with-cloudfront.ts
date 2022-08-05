#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

export interface StaticSiteWithCloudfrontProps {
  /**
   * Fully Qualified Domain Name (FQDN) for the cloudfront distribution.
   */
  domainName: string;
  hostedZone: route53.HostedZone;
  /**
   * A certificate to associate with the cloudfront distribution. The certificate must be located in N. Virginia (us-east-1).
   */
  certificate: acm.Certificate;
  /**
   * The sources from which to deploy the contents of the site.
   */
  siteContentSources: cdk.aws_s3_deployment.ISource[]
}

export class StaticSiteWithCloudfront extends Construct {

  constructor(parent: cdk.Stack, id: string, props: StaticSiteWithCloudfrontProps) {
    super(parent, id);

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, `${id}-cloudfront-OAI`, {
      comment: `OAI for ${props.domainName}`
    });
    // Content bucket
    const siteBucket = new s3.Bucket(this, `${id}-SiteBucket`, {
      bucketName: `${props.domainName}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // remove bucket when calling `cdk destroy`
      removalPolicy: RemovalPolicy.DESTROY,
      // bucket must be empty to be deleted.
      autoDeleteObjects: true,
    });
    // Grant access to cloudfront
    siteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [siteBucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    }));
    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, `${id}-SiteDistribution`, {
      certificate: props.certificate,
      defaultRootObject: "index.html",
      domainNames: [props.domainName],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/error.html',
          ttl: Duration.minutes(30),
        }
      ],
      defaultBehavior: {
        origin: new cloudfront_origins.S3Origin(siteBucket, { originAccessIdentity: cloudfrontOAI }),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      }
    });

    // Route53 alias record for the CloudFront distribution
    new route53.ARecord(this, `${id}-SiteAliasRecord`, {
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone: props.hostedZone
    });

    // Deploy site contents to S3 bucket
    new s3deploy.BucketDeployment(this, `${id}-DeployWithInvalidation`, {
      sources: props.siteContentSources,
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
    });
  }
}
