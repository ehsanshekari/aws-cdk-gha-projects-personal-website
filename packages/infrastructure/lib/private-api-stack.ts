import * as cdk from "aws-cdk-lib";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { Construct } from "constructs";

export class PrivateApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Create VPC
    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    // 2. Create Lambda Function
    const handler = new lambda.Function(this, "LambdaHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            body: JSON.stringify({ message: "Hello from Private API!" })
          };
        };
      `),
      handler: "index.handler",
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // 3. Create VPC Endpoint for API Gateway
    const vpcEndpoint = new ec2.InterfaceVpcEndpoint(
      this,
      "ApiGatewayVpcEndpoint",
      {
        vpc,
        service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
        privateDnsEnabled: true,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );

    // 4. Create Private Hosted Zone
    const hostedZone = new route53.PrivateHostedZone(this, "HostedZone", {
      zoneName: "internal.com",
      vpc,
    });

    // 5. Create SSL Certificate
    const certificate = new acm.Certificate(this, "Certificate", {
      domainName: "api.internal.com",
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // 6. Create API Gateway REST API (PRIVATE)
    const api = new apigw.RestApi(this, "PrivateApi", {
      endpointConfiguration: {
        types: [apigw.EndpointType.PRIVATE],
        vpcEndpoints: [vpcEndpoint],
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ["execute-api:Invoke"],
            resources: ["execute-api:/*"],
            conditions: {
              StringEquals: {
                "aws:SourceVpce": vpcEndpoint.vpcEndpointId,
              },
            },
          }),
        ],
      }),
      deployOptions: {
        stageName: "prod",
      },
    });

    // 7. Create and attach the custom domain name separately
    const apiDomain = new apigw.DomainName(this, "ApiDomainName", {
      domainName: "api.internal.com",
      certificate,
      endpointType: apigw.EndpointType.REGIONAL,
      securityPolicy: apigw.SecurityPolicy.TLS_1_2,
    });

    // 8. Map the domain to the API stage
    apiDomain.addBasePathMapping(api, {
      basePath: "",
      stage: api.deploymentStage,
    });

    // 9. Create DNS A record using the domain name resource
    new route53.ARecord(this, "AliasRecord", {
      zone: hostedZone,
      recordName: "api",
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayDomain(apiDomain) // ✅ Correct class to use here
      ),
    });

    // 10. Output the URL
    new cdk.CfnOutput(this, "ApiUrl", {
      value: `https://api.internal.com/prod`,
      description: "Private API URL",
    });
  }
}
