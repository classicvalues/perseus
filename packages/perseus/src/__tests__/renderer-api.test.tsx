import {describe, beforeEach, it} from "@jest/globals";
import {RenderStateRoot} from "@khanacademy/wonder-blocks-core";
import {mount} from "enzyme"; // eslint-disable-line no-restricted-imports
import $ from "jquery";
import * as React from "react";
import ReactDOM from "react-dom";
import TestUtils from "react-dom/test-utils";
import _ from "underscore";
import "jest-enzyme";

import {ClassNames, Dependencies, Renderer} from "@khanacademy/perseus";

import {testDependencies} from "../../../../testing/test-dependencies";
import {registerAllWidgetsForTesting} from "../util/register-all-widgets-for-testing";

import imageItem from "./test-items/image-item";
import inputNumber1Item from "./test-items/input-number-1-item";
import inputNumber2Item from "./test-items/input-number-2-item";
import tableItem from "./test-items/table-item";

const itemWidget = inputNumber1Item;

// Returns a promise that will resolve shortly after the end of this
// browser tick (roughly a `setTimeout(0)`)
const delayedPromise = (value: undefined) => {
    const deferred = $.Deferred();
    _.defer(() => {
        deferred.resolve(value);
    });
    return deferred.promise();
};

const renderQuestionArea = function (item, apiOptions): any {
    const wrapper = mount(
        <RenderStateRoot>
            <Renderer
                content={item.question.content}
                images={item.question.images}
                widgets={item.question.widgets}
                problemNum={0}
                apiOptions={apiOptions}
            />
        </RenderStateRoot>,
        {includeDefaultTestHarness: false},
    );
    return wrapper.childAt(0).instance();
};

describe("Perseus API", function () {
    beforeEach(() => {
        jest.spyOn(Dependencies, "getDependencies").mockReturnValue(
            testDependencies,
        );
        registerAllWidgetsForTesting();
    });

    describe("setInputValue", function () {
        it("should be able to produce a correctly graded value", function () {
            // @ts-expect-error - TS2554 - Expected 2 arguments, but got 1.
            const renderer = renderQuestionArea(inputNumber1Item);
            renderer.setInputValue(["input-number 1"], "5");
            const score = renderer.guessAndScore()[1];
            expect(score.type).toBe("points");
            expect(score.earned).toBe(score.total);
        });

        it("should be able to produce a wrong value", function () {
            // @ts-expect-error - TS2554 - Expected 2 arguments, but got 1.
            const renderer = renderQuestionArea(inputNumber1Item);
            renderer.setInputValue(["input-number 1"], "3", () => {});
            const score = renderer.guessAndScore()[1];
            expect(score.type).toBe("points");
            expect(score.earned).toBe(0);
        });

        it("should be able to produce an empty score", function () {
            // @ts-expect-error - TS2554 - Expected 2 arguments, but got 1.
            const renderer = renderQuestionArea(inputNumber1Item);
            renderer.setInputValue(["input-number 1"], "3");
            let score = renderer.guessAndScore()[1];
            expect(score.type).toBe("points");
            expect(score.earned).toBe(0);
            renderer.setInputValue(["input-number 1"], "");
            score = renderer.guessAndScore()[1];
            expect(score.type).toBe("invalid");
        });

        it("should be able to accept a callback", function (done) {
            // @ts-expect-error - TS2554 - Expected 2 arguments, but got 1.
            const renderer = renderQuestionArea(inputNumber1Item);
            renderer.setInputValue(["input-number 1"], "3", function () {
                const guess = renderer.getUserInput()[0];
                expect(guess.currentValue).toBe("3");
                done();
            });
            jest.runAllTimers();
        });
    });

    describe("getInputPaths", function () {
        it("should be able to find all the input widgets", function () {
            // @ts-expect-error - TS2554 - Expected 2 arguments, but got 1.
            const renderer = renderQuestionArea(inputNumber2Item);
            const numPaths = renderer.getInputPaths().length;
            expect(numPaths).toBe(2);
        });

        it("should be able to find all inputs within widgets", function () {
            // @ts-expect-error - TS2554 - Expected 2 arguments, but got 1.
            const renderer = renderQuestionArea(tableItem);
            const numPaths = renderer.getInputPaths().length;
            expect(numPaths).toBe(8);
        });
    });

    describe("getDOMNodeForPath", function () {
        it("should find one DOM node per <input>", function () {
            // @ts-expect-error - TS2554 - Expected 2 arguments, but got 1.
            const renderer = renderQuestionArea(inputNumber2Item);
            const inputPaths = renderer.getInputPaths();
            const allInputs = TestUtils.scryRenderedDOMComponentsWithTag(
                renderer,
                "input",
            );
            expect(inputPaths).toHaveLength(allInputs.length);
        });

        it("should find the right DOM nodes for the <input>s", function () {
            // @ts-expect-error - TS2554 - Expected 2 arguments, but got 1.
            const renderer = renderQuestionArea(inputNumber2Item);
            const inputPaths = renderer.getInputPaths();
            const allInputs = TestUtils.scryRenderedDOMComponentsWithTag(
                renderer,
                "input",
            );
            _.each(inputPaths, (inputPath, i) => {
                const $node = $(renderer.getDOMNodeForPath(inputPath));
                // @ts-expect-error - TS2769 - No overload matches this call.
                const $input = $(ReactDOM.findDOMNode(allInputs[i]));
                // @ts-expect-error - TS2339 - Property 'closest' does not exist on type 'JQueryStatic'.
                expect($input.closest($node).length).toBeTruthy();
            });
        });
    });

    describe("onInputError", function () {
        it("should call a callback when grading an empty input-number", function () {
            let wasCalled;
            const renderer = renderQuestionArea(inputNumber1Item, {
                onInputError: function (widgetId) {
                    wasCalled = true;
                },
            });
            const score = renderer.guessAndScore()[1];
            expect(score.type).toBe("invalid");
            expect(wasCalled).toBe(true);
        });
    });

    describe("CSS ClassNames", function () {
        describe("perseus-focused", function () {
            it("should be on an input-number exactly when focused", function () {
                // Feel free to change this if you change the class name,
                // but if you do, you must up the perseus api [major]
                // version
                expect(ClassNames.FOCUSED).toBe("perseus-focused");

                const renderer = renderQuestionArea(inputNumber1Item, {
                    interceptInputFocus: function (widgetId) {
                        renderer.setInputValue(widgetId, "5");
                    },
                });

                const input =
                    // @ts-expect-error - TS2531 - Object is possibly 'null'. | TS2339 - Property 'querySelector' does not exist on type 'Element | Text'.
                    ReactDOM.findDOMNode(renderer).querySelector("input");

                // @ts-expect-error - TS2532 - Object is possibly 'undefined'.
                expect($(input).attr("class").includes("focused")).toBe(false);

                TestUtils.Simulate.focus(input);
                // @ts-expect-error - TS2532 - Object is possibly 'undefined'.
                expect($(input).attr("class").includes("focused")).toBe(true);

                TestUtils.Simulate.blur(input);
                // @ts-expect-error - TS2532 - Object is possibly 'undefined'.
                expect($(input).attr("class").includes("focused")).toBe(false);
            });
        });
    });

    describe("onFocusChange", function () {
        it("should be called from focused to blurred to back on one input", async function () {
            // TODO(WEB-998): Migrate tests still using real timers to using fake timers
            jest.useRealTimers();
            let callCount = 0;
            let newFocusResult;
            let oldFocusResult;
            const renderer = renderQuestionArea(inputNumber1Item, {
                onFocusChange: function (newFocus, oldFocus) {
                    callCount++;
                    newFocusResult = newFocus;
                    oldFocusResult = oldFocus;
                },
            });

            // @ts-expect-error - TS2531 - Object is possibly 'null'. | TS2339 - Property 'querySelector' does not exist on type 'Element | Text'.
            const input = ReactDOM.findDOMNode(renderer).querySelector("input");

            callCount = 0;
            TestUtils.Simulate.focus(input);
            // Technically, this is probably synchronous, but we do want
            // to make sure that this hasn't been called a second time
            // asynchronously, so we check after waiting for an async
            // result here. This also means that this test should
            // continue to pass if we decide it makes more sense for
            // this callback to be async, which could reasonably happen
            // @ts-expect-error - TS2554 - Expected 1 arguments, but got 0.
            return delayedPromise()
                .then(() => {
                    expect(callCount).toBe(1);
                    expect(oldFocusResult).toBe(null);
                    expect(newFocusResult).toEqual(["input-number 1"]);

                    callCount = 0;
                    TestUtils.Simulate.blur(input);
                    // @ts-expect-error - TS2554 - Expected 1 arguments, but got 0.
                    return delayedPromise();
                })
                .then(() => {
                    expect(callCount).toBe(1);
                    expect(oldFocusResult).toEqual(["input-number 1"]);
                    expect(newFocusResult).toBe(null);
                });
        });

        it("should be called focusing between two inputs", async function () {
            // TODO(WEB-998): Migrate tests still using real timers to using fake timers
            jest.useRealTimers();
            let callCount = 0;
            let newFocusResult;
            let oldFocusResult;
            const renderer = renderQuestionArea(inputNumber2Item, {
                onFocusChange: function (newFocus, oldFocus) {
                    callCount++;
                    newFocusResult = newFocus;
                    oldFocusResult = oldFocus;
                },
            });

            const inputs =
                // @ts-expect-error - TS2531 - Object is possibly 'null'. | TS2339 - Property 'querySelectorAll' does not exist on type 'Element | Text'.
                ReactDOM.findDOMNode(renderer).querySelectorAll("input");
            const input1 = inputs[0];
            const input2 = inputs[1];
            TestUtils.Simulate.focus(input1);

            callCount = 0;
            TestUtils.Simulate.focus(input2);
            // Technically, this is probably synchronous, but we do want
            // to make sure that this hasn't been called a second time
            // asynchronously, so we check after waiting for an async
            // result here. This also means that this test should
            // continue to pass if we decide it makes more sense for
            // this callback to be async, which could reasonably happen
            // @ts-expect-error - TS2554 - Expected 1 arguments, but got 0.
            return delayedPromise().then(() => {
                expect(callCount).toBe(1);
                expect(oldFocusResult).toEqual(["input-number 1"]);
                expect(newFocusResult).toEqual(["input-number 2"]);
            });
        });
    });

    describe("widget placeholders", function () {
        it("should replace widgets with [WIDGET]", function () {
            const widgetPlaceholder = <span key="test">[WIDGET]</span>;
            const apiOptions = {
                widgetPlaceholder: widgetPlaceholder,
            } as const;
            const renderer = TestUtils.renderIntoDocument(
                <Renderer
                    content={itemWidget.question.content}
                    images={itemWidget.question.images}
                    widgets={itemWidget.question.widgets}
                    problemNum={0}
                    apiOptions={apiOptions}
                />,
            );

            const spans = TestUtils.scryRenderedDOMComponentsWithTag(
                // @ts-expect-error - TS2345 - Argument of type 'void' is not assignable to parameter of type 'Component<any, {}, any>'.
                renderer,
                "span",
            );

            expect(spans[0].textContent).toEqual("[WIDGET]");
        });

        it("should replace images with [IMAGE]", function () {
            const imagePlaceholder = <span key="test">[IMAGE]</span>;
            const apiOptions = {
                imagePlaceholder: imagePlaceholder,
            } as const;
            const renderer = TestUtils.renderIntoDocument(
                <Renderer
                    content={imageItem.question.content}
                    images={imageItem.question.images}
                    widgets={imageItem.question.widgets}
                    problemNum={0}
                    apiOptions={apiOptions}
                />,
            );

            const spans = TestUtils.scryRenderedDOMComponentsWithTag(
                // @ts-expect-error - TS2345 - Argument of type 'void' is not assignable to parameter of type 'Component<any, {}, any>'.
                renderer,
                "span",
            );

            expect(spans[0].textContent).toEqual("[IMAGE]");
        });
    });
});
