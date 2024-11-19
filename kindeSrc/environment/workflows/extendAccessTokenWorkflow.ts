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
    "kinde.env": {}
  }
};

export default {
  async handle(event: onUserTokenGeneratedEvent) {
    console.log('Infrestructure version', version)
    const excludedPermissions = ['payments:create'];
    
    const orgCode = event.context.organization.code;
    const userId = event.context.user.id;

    console.log(event)
    
    const kindeAPI = await createKindeAPI(event);
    const ipInfoToken = getEnvironmentVariable('IP_INFO_TOKEN')?.value
    const { data: ipDetails } = await fetch(`https://ipinfo.io/${event.request.ip}?token=${ipInfoToken}`, {
      method: "GET",
      responseFormat: 'json',
      headers: {
        "Content-Type": "application/json",
      }
    });

    console.log(ipDetails)
    
    const { data: res } = await kindeAPI.get(
      `organizations/${orgCode}/users/${userId}/permissions`
    );

    console.log('res', res);

    const accessToken = accessTokenCustomClaims<{ hello: string; settings: string; permissions: [], timezone: string;}>();
    accessToken.hello = "Hello there how are you?!";
    accessToken.settings = settings.output
    accessToken.permissions =  res.permissions.filter((p) => !excludedPermissions.includes(p.key))
    accessToken.timezone = ipDetails.timezone;
  }
}