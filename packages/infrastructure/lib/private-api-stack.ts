import {
  Stack,
  StackProps,
  CfnOutput,
  aws_apigateway as apigw,
  aws_lambda as lambda,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_route53 as route53,
  aws_route53_targets as targets,
  aws_certificatemanager as acm,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export class PrivateApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1. VPC Configuration
    const vpc = new ec2.Vpc(this, "CustomVpc", {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "private-subnet",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: "public-subnet",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      natGateways: 1,
    });

    // 2. Lambda Function
    const fn = new lambda.Function(this, "PrivateApiLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
        exports.handler = async () => {
          return {
            statusCode: 200,
            body: "Hello from Private Lambda!"
          };
        };
      `),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // 3. API Gateway VPC Endpoint
    const apiGatewayVpce = new ec2.InterfaceVpcEndpoint(this, "ApiGwVpce", {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
      privateDnsEnabled: true,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // 4. Private Hosted Zone
    const hostedZone = new route53.PrivateHostedZone(
      this,
      "InternalHostedZone",
      {
        zoneName: "internal.com",
        vpc,
      }
    );

    // 5. SSL Certificate
    const certificate = new acm.Certificate(this, "PrivateApiCertificate", {
      domainName: "api.internal.com",
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // 6. Custom Domain Name - Must be created before the API
    const domainName = new apigw.DomainName(this, "PrivateApiDomain", {
      domainName: "api.internal.com",
      certificate,
      endpointType: apigw.EndpointType.PRIVATE,
      securityPolicy: apigw.SecurityPolicy.TLS_1_2,
    });

    // 7. Private REST API
    const api = new apigw.RestApi(this, "PrivateApi", {
      restApiName: "PrivateApiGateway",
      endpointConfiguration: {
        types: [apigw.EndpointType.PRIVATE],
        vpcEndpoints: [apiGatewayVpce],
      },
      deployOptions: {
        stageName: "dev",
      },
    });

    // 8. API Mapping - Connect domain to API
    new apigw.BasePathMapping(this, "ApiMapping", {
      domainName,
      restApi: api,
      stage: api.deploymentStage,
    });

    // 9. API Gateway Resources and Methods
    const integration = new apigw.LambdaIntegration(fn);
    api.root.addResource("hello").addMethod("GET", integration);

    // 10. Resource Policy
    const apiGatewayRestApi = api.node.defaultChild as apigw.CfnRestApi;
    apiGatewayRestApi.policy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          actions: ["execute-api:Invoke"],
          resources: ["execute-api:/*"],
          conditions: {
            StringEquals: {
              "aws:SourceVpce": apiGatewayVpce.vpcEndpointId,
            },
          },
        }),
      ],
    }).toJSON();

    // 11. DNS Records
    new route53.ARecord(this, "PrivateApiARecord", {
      zone: hostedZone,
      recordName: "api",
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayDomain(domainName)
      ),
      ttl: Duration.minutes(5),
    });

    // 12. Outputs
    new CfnOutput(this, "InvokeUrl", {
      value: `https://api.internal.com/dev/hello`,
      description: "URL to invoke the private API",
      exportName: "PrivateApiInvokeUrl",
    });

    new CfnOutput(this, "VpcEndpointDns", {
      value: apiGatewayVpce.vpcEndpointDnsEntries[0],
      description: "DNS name of the API Gateway VPC Endpoint",
    });
  }
}
