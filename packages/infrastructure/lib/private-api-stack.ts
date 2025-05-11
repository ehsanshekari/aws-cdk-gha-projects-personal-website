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

    const zoneName = "internal.com";
    const subdomain = "api";
    const fullDomain = `${subdomain}.${zoneName}`;

    // 1. VPC
    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // 2. Lambda in VPC
    const handler = new lambda.Function(this, "LambdaHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline(`
        exports.handler = async () => {
          return {
            statusCode: 200,
            body: JSON.stringify({ message: "Hello from Private API!" }),
          };
        };
      `),
      handler: "index.handler",
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // 3. VPC Endpoint for API Gateway
    const vpcEndpoint = new ec2.InterfaceVpcEndpoint(this, "ApiGwVpcEndpoint", {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      privateDnsEnabled: true,
    });

    // 4. Private Hosted Zone
    const hostedZone = new route53.PrivateHostedZone(this, "HostedZone", {
      zoneName,
      vpc,
    });

    // 5. Certificate for internal domain
    const certificate = new acm.Certificate(this, "Cert", {
      domainName: fullDomain,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // 6. API Gateway - Private type
    const api = new apigw.RestApi(this, "PrivateApi", {
      endpointConfiguration: {
        types: [apigw.EndpointType.PRIVATE],
        vpcEndpoints: [vpcEndpoint],
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["execute-api:Invoke"],
            resources: ["execute-api:/*"],
            principals: [new iam.AnyPrincipal()],
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

    // 7. Integration and resource/method
    const resource = api.root.addResource("hello");
    resource.addMethod("GET", new apigw.LambdaIntegration(handler));

    // 8. Custom domain (must be defined separately from RestApi)
    const apiDomain = new apigw.DomainName(this, "CustomDomain", {
      domainName: fullDomain,
      certificate,
      endpointType: apigw.EndpointType.REGIONAL,
      securityPolicy: apigw.SecurityPolicy.TLS_1_2,
    });

    apiDomain.addBasePathMapping(api, {
      basePath: "",
      stage: api.deploymentStage,
    });

    // 9. Route 53 alias record using the domain object (not API)
    new route53.ARecord(this, "AliasRecord", {
      zone: hostedZone,
      recordName: subdomain,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayDomain(apiDomain)
      ),
    });

    // 10. Debug outputs to trace issues
    new cdk.CfnOutput(this, "DomainName", {
      value: fullDomain,
    });

    new cdk.CfnOutput(this, "VpcEndpointId", {
      value: vpcEndpoint.vpcEndpointId,
    });

    new cdk.CfnOutput(this, "ApiInvokeUrl", {
      value: `https://${fullDomain}/prod/hello`,
      description: "Use this from within the VPC only",
    });
  }
}
