import React from 'react';
import PropTypes from 'prop-types';
import {AreaChart, Card, CardBody, HeadingText, NrqlQuery, Spinner, AutoSizer} from 'nr1';

export default class ColorCwvVisualization extends React.Component {
    // Custom props you wish to be configurable in the UI must also be defined in
    // the nr1.json file for the visualization. See docs for more details.
    static propTypes = {
        alternateColors: PropTypes.bool,
        color1: PropTypes.string,
        color2: PropTypes.string,
        color3: PropTypes.string,
        /**
         * An array of objects consisting of a nrql `query` and `accountId`.
         * This should be a standard prop for any NRQL based visualizations.
         */
        nrqlQueries: PropTypes.arrayOf(
            PropTypes.shape({
                accountId: PropTypes.number,
                query: PropTypes.string,
            })
        ),
    };

    /**
     * Modify colors using New Relic palette:
     * Normal/Operational #01B076
     * Warning/Degraded #F0B400
     * Critical/Disrupted #DF2D24
     */
    transformData = (rawData) => {
        if (this.props.alternateColors === null || this.props.alternateColors === false) {
            return rawData;
        }
        let index = 0;
        const transformedData = rawData.map((entity) => {
            if (index === 0) {
                entity.metadata.color = this.props.color1 || '#01B076';
            }
            if (index === 1) {
                entity.metadata.color = this.props.color2 || '#F0B400';
            }
            if (index === 2) {
                entity.metadata.color = this.props.color3 || '#DF2D24';
            }
            index++;
            return entity;
        });
        return transformedData;
    };

    render() {
        const {nrqlQueries, stroke, fill} = this.props;

        const nrqlQueryPropsAvailable =
            nrqlQueries &&
            nrqlQueries[0] &&
            nrqlQueries[0].accountId &&
            nrqlQueries[0].query;

        if (!nrqlQueryPropsAvailable) {
            return <EmptyState />;
        }

        return (
            <AutoSizer>
                {({width, height}) => (
                    <NrqlQuery
                        query={nrqlQueries[0].query}
                        accountId={parseInt(nrqlQueries[0].accountId)}
                        pollInterval={NrqlQuery.AUTO_POLL_INTERVAL}
                    >
                        {({data, loading, error}) => {
                            if (loading) {
                                return <Spinner />;
                            }

                            if (error) {
                                return <ErrorState />;
                            }

                            const transformedData = this.transformData(data);

                            return (
                                <AreaChart
                                    data={transformedData}
                                    fullWidth
                                    fullHeight
                                />
                            );
                        }}
                    </NrqlQuery>
                )}
            </AutoSizer>
        );
    }
}

const EmptyState = () => (
    <Card className="EmptyState">
        <CardBody className="EmptyState-cardBody">
            <HeadingText
                spacingType={[HeadingText.SPACING_TYPE.LARGE]}
                type={HeadingText.TYPE.HEADING_3}
            >
                Please provide at least one NRQL query & account ID pair
            </HeadingText>
            <HeadingText
                spacingType={[HeadingText.SPACING_TYPE.MEDIUM]}
                type={HeadingText.TYPE.HEADING_4}
            >
                An example NRQL query you can try is:
            </HeadingText>
            <code>
                FROM NrUsage SELECT sum(usage) FACET metric SINCE 1 week ago
            </code>
        </CardBody>
    </Card>
);

const ErrorState = () => (
    <Card className="ErrorState">
        <CardBody className="ErrorState-cardBody">
            <HeadingText
                className="ErrorState-headingText"
                spacingType={[HeadingText.SPACING_TYPE.LARGE]}
                type={HeadingText.TYPE.HEADING_3}
            >
                Oops! Something went wrong.
            </HeadingText>
        </CardBody>
    </Card>
);
