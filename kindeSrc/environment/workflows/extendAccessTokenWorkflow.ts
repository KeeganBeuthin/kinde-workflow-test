import { onUserTokenGeneratedEvent, version, createKindeAPI, accessTokenCustomClaims, WorkflowSettings, WorkflowTrigger } from "@kinde/infrastructure"
import { settings } from "../../../utils/utils";

export const workflowSettings: WorkflowSettings = {
  id: "addAccessTokenClaim",
  trigger: WorkflowTrigger.UserTokenGeneration,
  name: "Add Access Token Claim",
  bindings: {
    "kinde.accessToken": {},
    "kinde.fetch": {},
    "url": {},
    "kinde.env": {
      scopes: ["read:organization_user_permissions"]
    }
  }
};

export default {
  async handle(event: onUserTokenGeneratedEvent) {
    console.log('Infrastructure version', version)
    const excludedPermissions = ['payments:create'];
    
    const orgCode = event.context.organization.code;
    const userId = event.context.user.id;

    console.log(event)
    
    const kindeAPI = await createKindeAPI(event);
    
    let permissions = [];
    try {
      const { data: res } = await kindeAPI.get(
        `organizations/${orgCode}/users/${userId}/permissions`
      );
      permissions = (res?.permissions || []).filter((p) => !excludedPermissions.includes(p.key));
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }

    const accessToken = accessTokenCustomClaims<{ 
      hello: string; 
      settings: string; 
      permissions: any[];
    }>();
    
    accessToken.hello = "Hello there how are you?!";
    accessToken.settings = settings.output;
    accessToken.permissions = permissions;
  }
}