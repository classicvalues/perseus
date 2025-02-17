/* eslint-disable react/sort-comp */
import * as KAS from "@khanacademy/kas";
import {
    components,
    Changeable,
    Dependencies,
    Expression,
    PerseusExpressionAnswerFormConsidered,
} from "@khanacademy/perseus";
import {isTruthy} from "@khanacademy/wonder-stuff-core";
// eslint-disable-next-line import/no-extraneous-dependencies
import lens from "hubble";
import * as React from "react";
import _ from "underscore";

import SortableArea from "../components/sortable";

import type {PerseusExpressionWidgetOptions} from "@khanacademy/perseus";

const {InfoTip, PropCheckBox, TexButtons} = components;
const {getDependencies} = Dependencies;

type Props = {
    widgetId?: any;
    value?: string;
} & Omit<PerseusExpressionWidgetOptions, "buttonsVisible"> &
    Changeable.ChangeableProps;

type DefaultProps = {
    answerForms: Props["answerForms"];
    times: Props["times"];
    buttonSets: Props["buttonSets"];
    functions: Props["functions"];
};

// Pick a key that isn't currently used by an answer in answerForms
const _makeNewKey = (answerForms: any) => {
    // first note all the currently used keys in an array, used like a map :3
    // note that this automatically updates the array's length property to
    // be one past the largest key.
    const usedKeys: Array<boolean> = [];
    answerForms.forEach((ans) => {
        usedKeys[ans.key] = true;
    });

    // then scan through the array to find the first unused (undefined) key
    for (let i = 0; i < usedKeys.length; i++) {
        if (!usedKeys[i]) {
            return i;
        }
    }

    // if we didn't find a key, make one bigger than all the other keys,
    // since that's how the length property is defined to work on arrays
    return usedKeys.length;
};

type State = {
    isTex: boolean;
};

class ExpressionEditor extends React.Component<Props, State> {
    static widgetName = "expression" as const;

    static defaultProps: DefaultProps = {
        answerForms: [],
        times: false,
        buttonSets: ["basic"],
        functions: ["f", "g", "h"],
    };

    constructor(props: Props) {
        super(props);
        // Is the format of `value` TeX or plain text?
        // TODO(alex): Remove after backfilling everything to TeX
        // TODO(joel) - sucks if you edit some expression without
        // backslashes or curly braces, then come back to the question and
        // it's surprisingly not TeX anymore.

        let isTex;
        // default to TeX if new;
        if (props.answerForms.length === 0) {
            isTex = true;
        } else {
            isTex = props.answerForms.some((form) => {
                const {value} = form;
                // only TeX has backslashes and curly braces
                return value.indexOf("\\") !== -1 || value.indexOf("{") !== -1;
            });
        }

        this.state = {isTex};
    }

    change(...args) {
        return Changeable.change.apply(this, args);
    }

    render(): React.ReactNode {
        const answerOptions = this.props.answerForms
            .map((obj, index) => {
                const expressionProps = {
                    // note we're using
                    // *this.props*.{times,functions,buttonSets} since each
                    // answer area has the same settings for those
                    times: this.props.times,
                    functions: this.props.functions,
                    buttonSets: this.props.buttonSets,

                    buttonsVisible: "focused",
                    form: obj.form,
                    simplify: obj.simplify,
                    value: obj.value,

                    onChange: (props) => this.updateForm(index, props),
                    trackInteraction: () => {},

                    widgetId: this.props.widgetId + "-" + index,
                } as const;

                return lens(obj)
                    .merge([], {
                        draggable: true,
                        onChange: (props) => this.updateForm(index, props),
                        onDelete: () => this.handleRemoveForm(index),
                        expressionProps: expressionProps,
                    })
                    .freeze();
            })
            .map((obj, index) => <AnswerOption key={index} {...obj} />);

        const sortable = (
            <SortableArea
                components={answerOptions}
                onReorder={this.handleReorder}
                className="answer-options-list"
            />
        );

        // checkboxes to choose which sets of input buttons are shown
        const buttonSetChoices = Object.keys(TexButtons.buttonSets).map(
            (name) => {
                // The first one gets special cased to always be checked, disabled,
                // and float left.
                const isFirst = name === "basic";
                const checked = this.props.buttonSets.includes(name) || isFirst;
                const className = isFirst
                    ? "button-set-label-float"
                    : "button-set-label";
                return (
                    <label className={className} key={name}>
                        <input
                            type="checkbox"
                            checked={checked}
                            disabled={isFirst}
                            onChange={() => this.handleButtonSet(name)}
                        />
                        {name}
                    </label>
                );
            },
        );

        const {TeX} = getDependencies(); // OldExpression only

        buttonSetChoices.splice(
            1,
            1,
            <label key="show-div">
                <input type="checkbox" onChange={this.handleToggleDiv} />
                <span className="show-div-button">
                    show <TeX>\div</TeX> button
                </span>
            </label>,
        );

        return (
            <div className="perseus-widget-expression-editor">
                <h3 className="expression-editor-h3">Global Options</h3>

                <div>
                    <PropCheckBox
                        times={this.props.times}
                        onChange={this.props.onChange}
                        labelAlignment="right"
                        label="Use × for rendering multiplication instead of a
                        center dot."
                    />
                    <InfoTip>
                        <p>
                            For pre-algebra problems this option displays
                            multiplication as \times instead of \cdot in both
                            the rendered output and the acceptable formats
                            examples.
                        </p>
                    </InfoTip>
                </div>

                <div>
                    <label>
                        {"Function variables: "}
                        <input
                            type="text"
                            defaultValue={this.props.functions.join(" ")}
                            onChange={this.handleFunctions}
                        />
                    </label>
                    <InfoTip>
                        <p>
                            Single-letter variables listed here will be
                            interpreted as functions. This let us know that f(x)
                            means "f of x" and not "f times x".
                        </p>
                    </InfoTip>
                </div>

                <div>
                    <div>Button sets:</div>
                    {buttonSetChoices}
                </div>

                {this.state.isTex && (
                    <TexButtons
                        className="math-input-buttons"
                        sets={this.props.buttonSets}
                        convertDotToTimes={this.props.times}
                        onInsert={this.handleTexInsert}
                    />
                )}

                <h3 className="expression-editor-h3">Answers</h3>

                <p style={{margin: "4px 0"}}>
                    student responses area matched against these from top to
                    bottom
                </p>

                {sortable}

                <div>
                    <button
                        className="simple-button orange"
                        style={{fontSize: 13}}
                        onClick={this.newAnswer}
                        type="button"
                    >
                        Add new answer
                    </button>
                </div>
            </div>
        );
    }

    serialize: () => any = () => {
        const formSerializables = [
            "value",
            "form",
            "simplify",
            "considered",
            // it's a little weird to serialize the react key, but saves some
            // effort reconstructing them when this item is loaded later.
            "key",
        ];
        const serializables = [
            "answerForms",
            "buttonSets",
            "functions",
            "times",
        ];

        const answerForms = this.props.answerForms.map((form) => {
            return _(form).pick(formSerializables);
        });

        return lens(this.props)
            .set(["answerForms"], answerForms)
            .mod([], (props) => _(props).pick(serializables))
            .freeze();
    };

    getSaveWarnings: () => any = () => {
        const issues: Array<any | string> = [];

        if (this.props.answerForms.length === 0) {
            issues.push("No answers specified");
        } else {
            const hasCorrect = this.props.answerForms.some((form) => {
                return form.considered === "correct";
            });
            if (!hasCorrect) {
                issues.push("No correct answer specified");
            }

            _(this.props.answerForms).each((form, ix) => {
                if (this.props.value === "") {
                    issues.push(`Answer ${ix + 1} is empty`);
                } else {
                    // note we're not using icu for content creators
                    const expression = KAS.parse(form.value, {
                        functions: this.props.functions,
                    });
                    if (!expression.parsed) {
                        issues.push(`Couldn't parse ${form.value}`);
                    } else if (
                        form.simplify &&
                        !expression.expr.isSimplified()
                    ) {
                        issues.push(
                            `${form.value} isn't simplified, but is required" +
                            " to be`,
                        );
                    }
                }
            });

            // TODO(joel) - warn about:
            //   - unreachable answers (how??)
            //   - specific answers following unspecific answers
            //   - incorrect answers as the final form
        }

        return issues;
    };

    _newEmptyAnswerForm: () => any = () => {
        return {
            considered: "correct",
            form: false,

            // note: the key means "n-th form created" - not "form in
            // position n" and will stay the same for the life of this form
            key: _makeNewKey(this.props.answerForms),

            simplify: false,
            value: "",
        };
    };

    newAnswer: () => void = () => {
        const answerForms = this.props.answerForms.slice();
        answerForms.push(this._newEmptyAnswerForm());
        this.change({answerForms});
    };

    handleRemoveForm: (arg1: number) => void = (i) => {
        const answerForms = this.props.answerForms.slice();
        answerForms.splice(i, 1);
        this.change({answerForms});
    };

    // called when the options (including the expression itself) to an answer
    // form change
    updateForm: (arg1: number, arg2: any) => void = (i, props) => {
        const answerForms = lens(this.props.answerForms)
            .merge([i], props)
            .freeze();

        this.change({answerForms});
    };

    handleReorder: (arg1: any) => void = (components) => {
        const answerForms = components.map((component) => {
            const form = _(component.props).pick(
                "considered",
                "form",
                "simplify",
                "value",
            );
            // @ts-expect-error - TS2339 - Property 'key' does not exist on type 'Pick<any, "form" | "value" | "simplify" | "considered">'.
            form.key = component.key;
            return form;
        });

        this.change({answerForms});
    };

    // called when the selected buttonset changes
    handleButtonSet: (arg1: string) => void = (changingName) => {
        const buttonSetNames = Object.keys(TexButtons.buttonSets);

        // Filter to preserve order - using .union and .difference would always
        // move the last added button set to the end.
        const buttonSets = buttonSetNames.filter((set) => {
            return (
                this.props.buttonSets.includes(set) !== (set === changingName)
            );
        });

        this.props.onChange({buttonSets});
    };

    handleToggleDiv: () => void = () => {
        // We always want buttonSets to contain exactly one of "basic" and
        // "basic+div". Toggle between the two of them.
        // If someone can think of a more elegant formulation of this (there
        // must be one!) feel free to change it.
        let keep: string | undefined;
        let remove: string | undefined;
        if (this.props.buttonSets.includes("basic+div")) {
            keep = "basic";
            remove = "basic+div";
        } else {
            keep = "basic+div";
            remove = "basic";
        }

        const buttonSets = this.props.buttonSets
            .filter((set) => set !== remove)
            .concat(keep);

        this.change("buttonSets", buttonSets);
    };

    // called when the correct answer changes
    handleTexInsert: (arg1: string) => void = (str) => {
        // eslint-disable-next-line react/no-string-refs
        // @ts-expect-error - TS2339 - Property 'insert' does not exist on type 'ReactInstance'.
        this.refs.expression.insert(str);
    };

    // called when the function variables change
    handleFunctions: (arg1: React.ChangeEvent<HTMLInputElement>) => void = (
        e,
    ) => {
        const newProps: Record<string, any> = {};
        newProps.functions = e.target.value.split(/[ ,]+/).filter(isTruthy);
        this.props.onChange(newProps);
    };
}

// Find the next element in arr after val, wrapping around to the first.
const findNextIn = function (arr: ReadonlyArray<string>, val: any) {
    let ix = arr.indexOf(val);
    ix = (ix + 1) % arr.length;
    return arr[ix];
};

type AnswerOptionProps = {
    considered: typeof PerseusExpressionAnswerFormConsidered[number];
    expressionProps: any;

    // Must the answer have the same form as this answer.
    form: boolean;

    // Must the answer be simplified.
    simplify: boolean;

    onDelete: () => void;
} & Changeable.ChangeableProps;

type AnswerOptionState = {
    deleteFocused: boolean;
};

class AnswerOption extends React.Component<
    AnswerOptionProps,
    AnswerOptionState
> {
    state = {deleteFocused: false};

    handleDeleteBlur = () => {
        this.setState({deleteFocused: false});
    };

    change = (...args) => {
        return Changeable.change.apply(this, args);
    };

    render(): React.ReactNode {
        let removeButton: React.ReactNode | null = null;
        if (this.state.deleteFocused) {
            removeButton = (
                <button
                    type="button"
                    className="simple-button orange"
                    onClick={this.handleImSure}
                    onBlur={this.handleDeleteBlur}
                >
                    I'm sure!
                </button>
            );
        } else {
            removeButton = (
                <button
                    type="button"
                    className="simple-button orange"
                    onClick={this.handleDelete}
                >
                    Delete
                </button>
            );
        }

        return (
            <div className="expression-answer-option">
                <div className="answer-handle" />

                <div className="answer-body">
                    <div className="answer-considered">
                        <div
                            onClick={this.toggleConsidered}
                            className={"answer-status " + this.props.considered}
                        >
                            {this.props.considered}
                        </div>

                        <div className="answer-expression">
                            <Expression {...this.props.expressionProps} />
                        </div>
                    </div>

                    <div className="answer-option">
                        <PropCheckBox
                            form={this.props.form}
                            onChange={this.props.onChange}
                            labelAlignment="right"
                            label="Answer expression must have the same form."
                        />
                        <InfoTip>
                            <p>
                                The student's answer must be in the same form.
                                Commutativity and excess negative signs are
                                ignored.
                            </p>
                        </InfoTip>
                    </div>

                    <div className="answer-option">
                        <PropCheckBox
                            simplify={this.props.simplify}
                            onChange={this.props.onChange}
                            labelAlignment="right"
                            label="Answer expression must be fully expanded and
                            simplified."
                        />
                        <InfoTip>
                            <p>
                                The student's answer must be fully expanded and
                                simplified. Answering this equation (x^2+2x+1)
                                with this factored equation (x+1)^2 will render
                                this response "Your answer is not fully expanded
                                and simplified."
                            </p>
                        </InfoTip>
                    </div>

                    <div className="remove-container">{removeButton}</div>
                </div>
            </div>
        );
    }

    handleImSure = () => {
        this.props.onDelete();
    };

    handleDelete = () => {
        this.setState({deleteFocused: true});
    };

    toggleConsidered = () => {
        const newVal = findNextIn(
            PerseusExpressionAnswerFormConsidered,
            this.props.considered,
        );
        this.change({considered: newVal});
    };
}

export default ExpressionEditor;
