import { APIGatewayProxyResult, APIGatewayProxyEvent } from "aws-lambda";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Placeholder for now
    console.log("Proxied logout call event: ", JSON.stringify(event, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Hello from logoutHandler!",
        input: event,
      }),
    };
  } catch (error) {
    console.error("Error in logoutHandler: ", error);
    throw error;
  }
}
