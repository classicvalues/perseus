import {
    BorderDirections,
    EchoAnimationTypes,
    KeyTypes,
    IconTypes,
} from "./consts";

import type {Key} from "./data/keys";

export type Border = Partial<Array<keyof typeof BorderDirections>>;

export type Bound = {
    top: number;
    right: number;
    bottom: number;
    left: number;
    height: number;
    width: number;
};

export type Popover = {
    parentId: Key;
    bounds: Partial<Bound>;
    childKeyIds: Array<Key>;
};

export type Echo = {
    animationId: string;
    animationType: keyof typeof EchoAnimationTypes;
    borders: Border;
    id: Key;
    initialBounds: DOMRect;
};

export type Icon = {
    type: keyof typeof IconTypes;
    data: string;
};

export type KeyConfig = {
    ariaLabel: string;
    id: Key;
    type: keyof typeof KeyTypes;
    childKeyIds: Array<Key>;
    icon: Icon;
};
