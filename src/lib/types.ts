export type ObjktAlias = "nikoalerce" | "sidequest" | (string & {});

export type ObjktCreator = {
  holder?: {
    address?: string | null;
    alias?: string | null;
  } | null;
};

export type ObjktListing = {
  id?: number | null;
  bigmap_key?: number | null;
  marketplace_contract?: string | null;
  currency_id?: number | null;
  price?: number | null;
  price_xtz?: number | null;
  amount?: number | null;
  amount_left?: number | null;
  seller_address?: string | null;
  status?: string | null;
};

export type ObjktOpenEdition = {
  end_time?: string | null;
  price?: number | null;
};

export type ObjktHolderQuantity = {
  quantity?: number | null;
};

export type ObjktToken = {
  pk?: number | null;
  token_id: string;
  name?: string | null;
  description?: string | null;
  display_uri?: string | null;
  artifact_uri?: string | null;
  thumbnail_uri?: string | null;
  mime?: string | null;
  fa_contract: string;
  timestamp?: string | null;
  supply?: number | null;
  lowest_ask?: number | null;
  creators?: ObjktCreator[] | null;
  /** active listings where the creator is the seller */
  listings_active?: ObjktListing[] | null;
  /** open edition activa (mint abierto con tiempo) */
  open_edition_active?: ObjktOpenEdition | null;
  /** editions the creator still holds */
  creator_holdings?: ObjktHolderQuantity[] | null;
};

export type TokenStatus = "for_sale" | "sold_out" | "in_collection";

export type ObjktHolder = {
  address: string;
  alias?: string | null;
  description?: string | null;
  twitter?: string | null;
  website?: string | null;
};

export type MediaKind = "video" | "image" | "model" | "html" | "audio" | "unknown";
