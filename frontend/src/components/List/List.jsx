import React from 'react';
import PropTypes from 'prop-types';
import Spinner from '../Spinner/Spinner';
import './List.css';

/**
 * Minimal reusable list.
 *
 * <List
 *   items={products}
 *   keyExtractor={item => item.id}
 *   renderItem={item => <ProductRow product={item} />}
 *   emptyMessage="No products found."
 * />
 */
function List({
  items = [],
  renderItem,
  keyExtractor,
  loading = false,
  emptyMessage = 'Nothing here yet',
  className = '',
}) {
  if (loading) {
    return (
      <p className={`list__status ${className}`.trim()} role="status">
        <Spinner size={20} label={emptyMessage} />
        Loading…
      </p>
    );
  }

  if (!items.length) {
    return <p className={`list__status ${className}`.trim()}>{emptyMessage}</p>;
  }

  return (
    <ul className={`list ${className}`.trim()}>
      {items.map((item, index) => (
        <li className="list__item" key={keyExtractor ? keyExtractor(item, index) : index}>
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

List.propTypes = {
  items: PropTypes.array,
  renderItem: PropTypes.func.isRequired,
  keyExtractor: PropTypes.func,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  className: PropTypes.string,
};

export default List;
