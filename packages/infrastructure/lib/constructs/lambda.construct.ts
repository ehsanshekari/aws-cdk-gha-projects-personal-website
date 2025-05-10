import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { StageType } from "../../config/constants";

const BASE_FUNCTION_PROPS = {
  runtime: lambda.Runtime.NODEJS_22_X,
  handler: "handler",
  timeout: cdk.Duration.seconds(30),
  tracing: lambda.Tracing.ACTIVE,
};

interface LambdaConstructProps {
  stageName: StageType;
  region: string;
}

export class LambdaConstruct extends Construct {
  public readonly signUpHandler: lambda.IFunction;
  public readonly loginHandler: lambda.IFunction;
  public readonly logoutHandler: lambda.IFunction;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    const { stageName, region } = props;
    const environment = { stageName, region };

    this.signUpHandler = new NodejsFunction(this, "SignUpHandler", {
      ...BASE_FUNCTION_PROPS,
      entry: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "api",
        "entrypoints",
        "users",
        "signup.handler.ts"
      ),
      environment,
    });

    new cdk.CfnOutput(this, "SignUpHandlerArn", {
      value: this.signUpHandler.functionArn,
      description: "ARN of the SignUpHandler function",
      exportName: "SignUpProxyHandlerArn",
    });

    this.loginHandler = new NodejsFunction(this, "LoginHandler", {
      ...BASE_FUNCTION_PROPS,
      entry: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "api",
        "entrypoints",
        "sessions",
        "login.handler.ts"
      ),
      environment,
    });

    new cdk.CfnOutput(this, "LoginHandlerArn", {
      value: this.loginHandler.functionArn,
      description: "ARN of the LoginHandler function",
      exportName: "LoginProxyHandlerArn",
    });

    this.logoutHandler = new NodejsFunction(this, "LogoutHandler", {
      ...BASE_FUNCTION_PROPS,
      entry: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "api",
        "entrypoints",
        "sessions",
        "logout.handler.ts"
      ),
      environment: environment,
    });

    new cdk.CfnOutput(this, "LogoutHandlerArn", {
      value: this.logoutHandler.functionArn,
      description: "ARN of the LogoutHandler function",
      exportName: "LogoutProxyHandlerArn",
    });
  }
}
