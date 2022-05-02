// @flow
/**
 * Direct image labeling widget editor.
 *
 * Label on image widget enables creating more natural, conceptual questions
 * that involve the use of images, and enable learners to demonstrate their
 * knowledge by directly interacting with the image.
 */

import {EditorJsonify, Util} from "@khanacademy/perseus";
import {StyleSheet, css} from "aphrodite";
import * as React from "react";

import FormWrappedTextField from "../components/form-wrapped-text-field.jsx";

import AnswerChoices from "./label-image/answer-choices.jsx";
import Behavior from "./label-image/behavior.jsx";
import QuestionMarkers from "./label-image/question-markers.jsx";
import SelectImage from "./label-image/select-image.jsx";

import type {MarkerType} from "@khanacademy/perseus";

type LabelImageEditorProps = {|
    // List of answer choices to label question image with.
    choices: $ReadOnlyArray<string>,

    // The question image properties.
    imageAlt: string,
    imageUrl: string,
    imageWidth: number,
    imageHeight: number,

    // The list of label markers on the question image.
    markers: $ReadOnlyArray<MarkerType>,

    // Whether multiple answer choices may be selected for markers.
    multipleAnswers: boolean,

    // Whether to hide answer choices from user instructions.
    hideChoicesFromInstructions: boolean,

    // Callback for when a widget prop is changed.
    onChange: (options: Object) => void,
|};

class LabelImageEditor extends React.Component<LabelImageEditorProps> {
    _questionMarkers: ?QuestionMarkers;

    static defaultProps: {|
        choices: $ReadOnlyArray<any>,
        hideChoicesFromInstructions: boolean,
        imageAlt: string,
        imageHeight: number,
        imageUrl: string,
        imageWidth: number,
        markers: $ReadOnlyArray<any>,
        multipleAnswers: boolean,
    |} = {
        choices: [],
        imageAlt: "",
        imageUrl: "",
        imageWidth: 0,
        imageHeight: 0,
        markers: [],
        multipleAnswers: false,
        hideChoicesFromInstructions: false,
    };

    static widgetName: string = "label-image";

    componentDidUpdate(prevProps: LabelImageEditorProps) {
        const coordsToMarkers = {};

        prevProps.markers.forEach(
            (marker) => (coordsToMarkers[`${marker.x}.${marker.y}`] = marker),
        );

        // Find the newly added marker indices.
        const newIndices = this.props.markers
            .map((marker, index) =>
                // eslint-disable-next-line no-prototype-builtins
                coordsToMarkers.hasOwnProperty(`${marker.x}.${marker.y}`)
                    ? -1
                    : index,
            )
            .filter((index) => index !== -1);

        // Automatically reveal their dropdowns as a prompt to the content
        // creator to select answers and set the ARIA label.
        if (newIndices.length && this._questionMarkers) {
            this._questionMarkers.openDropdownForMarkerIndices(newIndices);
        }
    }

    getSaveWarnings: () => $ReadOnlyArray<any | string> = () => {
        const {choices, imageAlt, imageUrl, markers} = this.props;

        const warnings = [];

        if (choices.length < 2) {
            warnings.push("Question requires at least two answer choices");
        }

        if (!imageUrl) {
            warnings.push("Image is not specified for question");
        } else if (!imageAlt) {
            warnings.push("Question image has no alt text");
        }

        if (!markers.length) {
            warnings.push("Question has no markers, to label answers on image");
        } else {
            let numNoAnswers = 0;
            let numNoLabels = 0;

            for (const marker of markers) {
                if (!marker.answers.length) {
                    numNoAnswers++;
                }

                if (!marker.label) {
                    numNoLabels++;
                }
            }

            if (numNoAnswers) {
                warnings.push(
                    `Question has ${numNoAnswers} markers with no ` +
                        "answers selected",
                );
            }

            if (numNoLabels) {
                warnings.push(
                    `Question has ${numNoLabels} markers with no ` +
                        "ARIA label",
                );
            }
        }

        return warnings;
    };

    serialize(): any {
        return EditorJsonify.serialize.call(this);
    }

    handleImageChange: (url: string) => void = (url: string) => {
        this.props.onChange({
            imageUrl: url,
            // Initially reset image size when URL is changed so it can be later
            // measured.
            imageWidth: 0,
            imageHeight: 0,
        });

        if (url) {
            Util.getImageSize(url, (width, height) => {
                this.props.onChange({
                    imageWidth: width,
                    imageHeight: height,
                });
            });
        }
    };

    handleAltChange: (alt: string) => void = (alt: string) => {
        this.props.onChange({imageAlt: alt});
    };

    handleChoicesChange: (choices: $ReadOnlyArray<string>) => void = (
        choices: $ReadOnlyArray<string>,
    ) => {
        this.props.onChange({choices});
    };

    handleMarkersChange: (markers: $ReadOnlyArray<MarkerType>) => void = (
        markers: $ReadOnlyArray<MarkerType>,
    ) => {
        this.props.onChange({markers});
    };

    handleBehaviorChange: (options: any) => void = (options: Object) => {
        this.props.onChange(options);
    };

    render(): React.Element<"div"> {
        const {
            choices,
            imageAlt,
            imageUrl,
            imageWidth,
            imageHeight,
            markers,
            multipleAnswers,
            hideChoicesFromInstructions,
        } = this.props;

        const imageSelected = imageUrl && imageWidth > 0 && imageHeight > 0;

        return (
            <div>
                <SelectImage onChange={this.handleImageChange} url={imageUrl} />

                <div className={css(styles.smallSpacer)} />

                {imageSelected && (
                    <FormWrappedTextField
                        placeholder="Alt text (for screen readers)"
                        onChange={(e) => this.handleAltChange(e.target.value)}
                        value={imageAlt}
                        width="100%"
                    />
                )}

                <div className={css(styles.largeSpacer)} />

                <QuestionMarkers
                    choices={choices}
                    imageUrl={imageSelected ? imageUrl : ""}
                    imageWidth={imageWidth}
                    imageHeight={imageHeight}
                    markers={markers}
                    onChange={this.handleMarkersChange}
                    ref={(node) => (this._questionMarkers = node)}
                />

                <div className={css(styles.largeSpacer)} />

                <AnswerChoices
                    choices={choices}
                    onChange={this.handleChoicesChange}
                />

                <div className={css(styles.largeSpacer)} />

                <Behavior
                    multipleAnswers={multipleAnswers}
                    hideChoicesFromInstructions={hideChoicesFromInstructions}
                    onChange={this.handleBehaviorChange}
                />
            </div>
        );
    }
}

const styles = StyleSheet.create({
    largeSpacer: {
        height: 32,
    },

    smallSpacer: {
        height: 16,
    },
});

export default LabelImageEditor;
