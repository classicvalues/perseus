import * as React from "react";

import AssetContext from "../asset-context";

import type {PerseusItem} from "../perseus-types";
import type {WidgetExports} from "../types";

// @ts-expect-error - TS2322 - Type '"mocked-asset-widget"' is not assignable to type '"categorizer" | "cs-program" | "definition" | "dropdown" | "example-graphie-widget" | "example-widget" | "explanation" | "expression" | "graded-group-set" | "graded-group" | ... 29 more ... | "video"'.
export const mockedAssetItem: PerseusItem = {
    question: {
        content: "[[\u2603 mocked-asset-widget 1]]",
        images: Object.freeze({}),
        widgets: {
            "mocked-asset-widget 1": {
                type: "mocked-asset-widget",
                alignment: "default",
                static: false,
                graded: true,
                options: Object.freeze({}),
                version: {major: 1, minor: 0},
            },
        },
    },
    answerArea: {
        calculator: false,
        chi2Table: false,
        periodicTable: false,
        tTable: false,
        zTable: false,
    },
    itemDataVersion: {major: 0, minor: 1},
    hints: [],
    _multi: null,
    answer: null,
} as const;

export class MockAssetLoadingWidget extends React.Component<Record<any, any>> {
    // @ts-expect-error - TS2564 - Property 'setAssetStatus' has no initializer and is not definitely assigned in the constructor.
    setAssetStatus: (assetKey: string, loaded: boolean) => void;

    render(): React.ReactNode {
        return (
            <AssetContext.Consumer>
                {({setAssetStatus}) => {
                    this.setAssetStatus = setAssetStatus;
                    <div />;
                }}
            </AssetContext.Consumer>
        );
    }
}

export default {
    name: "mocked-asset-widget",
    displayName: "Mocked Asset Widget",
    widget: MockAssetLoadingWidget,
} as WidgetExports<typeof MockAssetLoadingWidget>;
