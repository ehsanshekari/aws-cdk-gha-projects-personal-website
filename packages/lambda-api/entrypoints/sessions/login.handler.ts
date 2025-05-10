import { APIGatewayProxyResult, APIGatewayProxyEvent } from "aws-lambda";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Placeholder for now
    console.log("Proxied login call event: ", JSON.stringify(event, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Hello from loginHandler!",
        input: event,
      }),
    };
  } catch (error) {
    console.error("Error in loginHandler: ", error);
    throw error;
  }
}
