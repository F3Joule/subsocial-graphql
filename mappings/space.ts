import { SubstrateEvent, DB } from '../generated/hydra-processor'
import { Space } from '../generated/graphql-server/src/modules/space/space.model'
import { SpaceId } from '@subsocial/types/substrate/interfaces';
import { resolveIpfsSpaceData, resolveSpaceStruct } from './resolvers/resolveSpaceData';
import { insertTagInSpaceTags } from './tag';
import { isEmptyArray } from '@subsocial/utils';

export async function spaces_SpaceCreated(db: DB, event: SubstrateEvent) {
  await createSpace(db, event)
}

export async function spaces_SpaceUpdated(db: DB, event: SubstrateEvent) {
  const [address, id] = event.params

  if (event.extrinsic === undefined) {
    throw new Error(`No extrinsic has been provided`)
  }

  let space = await db.get(Space, { where: `space_id = '${id.value.toString()}'` })
  if (!space) {
    await createSpace(db, event)
    return
  }

  const spaceStruct = await resolveSpaceStruct(id.value as unknown as SpaceId)
  if (!spaceStruct) return

  if (space.updatedAtTime === spaceStruct.updatedAtTime) return

  space.createdByAccount = address.value.toString()
  space.ownerId = spaceStruct.owner

  const content = spaceStruct.content
  space.content = content

  const spaceContent = await resolveIpfsSpaceData(content)

  space.postsCount = spaceStruct.postsCount
  space.hiddenPostsCount = spaceStruct.hiddenPostsCount
  space.followersCount = spaceStruct.followersCount
  space.score = spaceStruct.score
  if (spaceContent) {
    space.name = spaceContent.name
    space.summary = spaceContent.about
    space.image = spaceContent.image
    space.tagsOriginal = spaceContent.tags.join(',')

    const tags = await insertTagInSpaceTags(db, spaceContent.tags, space.spaceId, space)
    if (!isEmptyArray(tags))
      space.tags = tags
  }

  await db.save<Space>(space)
}

const createSpace = async (db: DB, event: SubstrateEvent) => {
  const [address, id] = event.params

  if (event.extrinsic === undefined) {
    throw new Error(`No extrinsic has been provided`)
  }

  const space = new Space()

  const spaceStruct = await resolveSpaceStruct(id.value as unknown as SpaceId)
  if (!spaceStruct) return
  space.spaceId = id.value as string
  space.createdByAccount = address.value.toString()
  space.createdAtBlock = spaceStruct.createdAtBlock
  space.createdAtTime = spaceStruct.createdAtTime

  space.ownerId = spaceStruct.owner

  const content = spaceStruct.content
  space.content = content

  const spaceContent = await resolveIpfsSpaceData(content)

  space.postsCount = spaceStruct.postsCount
  space.hiddenPostsCount = spaceStruct.hiddenPostsCount
  space.publicPostsCount = space.postsCount - space.hiddenPostsCount
  space.followersCount = spaceStruct.followersCount
  space.score = spaceStruct.score
  if (spaceContent) {
    space.name = spaceContent.name
    space.summary = spaceContent.about
    space.image = spaceContent.image
    space.tagsOriginal = spaceContent.tags.join(',')

    const tags = await insertTagInSpaceTags(db, spaceContent.tags, space.spaceId, space)
    if (!isEmptyArray(tags))
      space.tags = tags
  }

  await db.save<Space>(space)
}