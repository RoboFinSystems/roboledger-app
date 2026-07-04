// Mock for react-markdown
import PropTypes from 'prop-types'
import React from 'react'

const ReactMarkdown = ({ children, ...props }) => {
  return React.createElement(
    'div',
    { 'data-testid': 'react-markdown', ...props },
    children
  )
}

ReactMarkdown.propTypes = {
  children: PropTypes.node,
}

export default ReactMarkdown
