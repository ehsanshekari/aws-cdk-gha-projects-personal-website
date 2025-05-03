import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface WebsiteCloudFrontDistributionProps {
  readonly domainNames: string[];
  readonly certificate: acm.ICertificate;
  readonly origin: origins.S3StaticWebsiteOrigin;
}

export class WebsiteCloudFrontDistribution extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(
    scope: Construct,
    id: string,
    props: WebsiteCloudFrontDistributionProps,
  ) {
    super(scope, id);

    this.distribution = new cloudfront.Distribution(
      this,
      "WebsiteCloudFrontDistribution",
      {
        defaultBehavior: {
          origin: props.origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        domainNames: props.domainNames,
        certificate: props.certificate,
        defaultRootObject: "index.html",
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        httpVersion: cloudfront.HttpVersion.HTTP2,
        enableLogging: true,
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: cdk.Duration.seconds(0),
          },
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: cdk.Duration.seconds(0),
          },
        ],
      },
    );
  }
}
