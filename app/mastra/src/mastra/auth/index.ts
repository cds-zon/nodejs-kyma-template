/**
 * Authentication Provider Factory
 * 
 * Creates and manages different authentication providers
 */

import { MastraAuthProvider } from "@mastra/core/server";
import ias from "./ias";
import dummy from "./dummy";
import mock from "./mock";
import cds from "@sap/cds";

export type ProviderType = typeof cds.requires.auth.kind;

export interface ProviderConfig {
  type: ProviderType;
  config?: any;
}


const providers: Record<ProviderType, Pick<MastraAuthProvider<cds.User>, "authenticateToken" | "authorizeUser">> = {
    "ias": ias,
    "dummy": dummy,
    "mock": mock
}

const which = providers[cds.requires.auth.kind];


export default  {
  authenticateToken: which.authenticateToken.bind(which),
  authorizeUser: which.authorizeUser.bind(which)
} 