import { withBackendAuth, AuthenticatedRequest } from "@/lib/auth/backend-middleware";
import { config } from "@/lib/config";

async function handleDebug(req: AuthenticatedRequest) {
  const user = req.user;
  const authToken = req.authToken;
  
  return Response.json({
    success: true,
    authType: config.auth.type,
    user: user,
    token: authToken,
    message: `Using ${config.auth.type} middleware`
  });
}

export const POST = withBackendAuth(handleDebug);
export const GET = withBackendAuth(handleDebug);
