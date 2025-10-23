import { withBackendAuth, AuthenticatedRequest } from "@/lib/auth/backend-middleware";

async function handleTest(req: AuthenticatedRequest) {
  const user = req.user;
  const authToken = req.authToken;
  
  return Response.json({
    success: true,
    user: user,
    token: authToken,
    message: "Authentication middleware is working!"
  });
}

export const POST = withBackendAuth(handleTest);
export const GET = withBackendAuth(handleTest);
