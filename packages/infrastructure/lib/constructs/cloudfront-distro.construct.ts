import { CfnOutput, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  Distribution,
  ViewerProtocolPolicy,
  AccessLevel,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { StageType } from "../../config/constants";

export interface CloudfrontConstructProps {
  domainName: string;
  certificate: ICertificate;
  bucket: IBucket;
  stageName: StageType;
  apiDomainName: string;
}

export class CloudfrontConstruct extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CloudfrontConstructProps) {
    super(scope, id);

    const { bucket, domainName, certificate, stageName, apiDomainName } = props;

    const s3BucketOrigin = S3BucketOrigin.withOriginAccessControl(bucket, {
      originAccessLevels: [AccessLevel.READ],
    });

    const apiOrigin = new origins.HttpOrigin(apiDomainName, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
      originPath: stageName,
    });

    const distribution = new Distribution(this, "HubDistribution", {
      defaultBehavior: {
        origin: s3BucketOrigin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      additionalBehaviors: {
        "/api/*": {
          origin: apiOrigin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.seconds(300),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.seconds(300),
        },
      ],
      domainNames: [domainName],
      certificate: certificate,
    });

    bucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [`${bucket.bucketArn}/*`],
        principals: [new ServicePrincipal("cloudfront.amazonaws.com")],
      })
    );

    new CfnOutput(this, "HubDistributionDomainName", {
      value: distribution.domainName,
      exportName: "HubDistributionDomainName",
    });

    new CfnOutput(this, "CloudFrontDistributionId", {
      value: distribution.distributionId,
      exportName: "HubCloudFrontDistributionId",
    });

    this.distribution = distribution;
  }
}
