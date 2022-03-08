import React from 'react';
import {SimpleNavLink} from "./SimpleNavLink";
import {StoredMetadata} from "../services/storage";

interface Props {
  md: StoredMetadata
  selectRow: (md: StoredMetadata) => void
  deleteFile: (md: StoredMetadata) => void
}

export function MediaSearchResult({md, selectRow, deleteFile}: Props) {
  return <span key={md.path}>
      <SimpleNavLink onClick={() => deleteFile(md)}>Delete</SimpleNavLink>
      <a href="javascript:void(0)" className="no-underline color-inherit" tabIndex={0} onClick={() => selectRow(md)}> - {md.path}</a>
    </span>;
}
