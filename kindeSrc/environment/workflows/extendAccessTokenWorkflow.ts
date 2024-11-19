import { onUserTokenGeneratedEvent,version, createKindeAPI, getEnvironmentVariable, accessTokenCustomClaims, WorkflowSettings, WorkflowTrigger, denyAccess, fetch } from "@kinde/infrastructure"
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
      variables: [
        "IP_INFO_TOKEN",
        "KINDE_M2M_CLIENT_ID",
        "KINDE_M2M_CLIENT_SECRET"
      ]
    }
  }
};

export default {
  async handle(event: onUserTokenGeneratedEvent) {
    console.log('Infrastructure version', version);
    
    const kindeAPI = await createKindeAPI(event, {
      clientId: getEnvironmentVariable('KINDE_M2M_CLIENT_ID')?.value,
      clientSecret: getEnvironmentVariable('KINDE_M2M_CLIENT_SECRET')?.value
    });

    const excludedPermissions = ['payments:create'];
    const orgCode = event.context.organization.code;
    const userId = event.context.user.id;

    console.log('Event context:', event);
    
    const ipInfoToken = getEnvironmentVariable('IP_INFO_TOKEN')?.value;
    if (!ipInfoToken) {
      console.error('IP_INFO_TOKEN not set');
    }

    const { data: ipDetails } = await fetch(
      `https://ipinfo.io/${event.request.ip}?token=${ipInfoToken}`, 
      {
        method: "GET",
        responseFormat: 'json',
        headers: {
          "Content-Type": "application/json",
        }
      }
    );

    console.log('IP Details:', ipDetails);
    
    const { data: res } = await kindeAPI.get(
      `organizations/${orgCode}/users/${userId}/permissions`
    );

    console.log('Permissions response:', res);

    const accessToken = accessTokenCustomClaims<{
      hello: string;
      settings: string;
      permissions: any[];
      timezone: string;
    }>();

    accessToken.hello = "Hello there how are you?!";
    accessToken.settings = settings.output;
    accessToken.permissions = res.permissions.filter(
      (p) => !excludedPermissions.includes(p.key)
    );
    accessToken.timezone = ipDetails.timezone;
  }
}
