import { SubsocialApi } from '@subsocial/api/subsocial'
import { Api } from '@subsocial/api/substrateConnect'
import { registry } from '@subsocial/types/substrate/registry'
import { ApiPromise } from '@polkadot/api'
import { ipfsReadOnlyNodeUrl, port } from '../env';
let subsocial: SubsocialApi
let api: ApiPromise

type Api = SubsocialApi & {
  api: ApiPromise
}

const ipfsConfig = {
  ipfsNodeUrl: ipfsReadOnlyNodeUrl,
  offchainUrl: `http://localhost:${port}`
}

export const resolveSubsocialApi = async (): Promise<Api> => {
  // Connect to Subsocial's Substrate node:

  if (!subsocial) {
    api = await Api.connect(process.env.SUBSTRATE_URL)
    const properties = await api.rpc.system.properties()

    registry.setChainProperties(properties)
    subsocial = new SubsocialApi({
      substrateApi: api,
      ...ipfsConfig
    });

    (subsocial as any).api = api

  }

  return subsocial as unknown as Api
}
